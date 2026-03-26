import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit } from '../_shared/rate-limit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Rate Limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(clientIp, 10, 60000)) {
      return new Response(
        JSON.stringify({ error: 'Zu viele Anfragen' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { checklisteId, anweisungen } = await req.json()

    if (!checklisteId) {
      return new Response(
        JSON.stringify({ error: 'checklisteId ist erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'KI nicht konfiguriert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Alle relevanten Daten laden
    const { data: checkliste } = await supabase
      .from('checklisten')
      .select('*')
      .eq('id', checklisteId)
      .single()

    if (!checkliste) {
      return new Response(
        JSON.stringify({ error: 'Checkliste nicht gefunden' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: mandant } = await supabase
      .from('mandanten')
      .select('name, email, typ')
      .eq('id', checkliste.mandant_id)
      .single()

    const { data: kanzlei } = await supabase
      .from('kanzleien')
      .select('name')
      .eq('id', mandant?.kanzlei_id || '')
      .single()

    // Dokumente mit Status laden
    const { data: dokumente } = await supabase
      .from('dokumente')
      .select('titel, status, pflicht')
      .eq('checkliste_id', checklisteId)
      .order('sortierung')

    const offeneDoks = (dokumente || []).filter(
      (d: { status: string; pflicht: boolean }) => d.pflicht && d.status === 'ausstehend'
    )
    const erledigteDoks = (dokumente || []).filter(
      (d: { status: string; pflicht: boolean }) => d.pflicht && (d.status === 'hochgeladen' || d.status === 'geprueft')
    )

    // Letzte Erinnerung pruefen
    const { data: letzteErinnerung } = await supabase
      .from('erinnerungen_log')
      .select('gesendet_am')
      .eq('checkliste_id', checklisteId)
      .order('gesendet_am', { ascending: false })
      .limit(1)
      .maybeSingle()

    const frist = new Date(checkliste.frist).toLocaleDateString('de-DE', {
      day: '2-digit', month: 'long', year: 'numeric',
    })

    const tageUebrig = Math.ceil(
      (new Date(checkliste.frist).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    // Sanitize user input
    const safeAnweisungen = (anweisungen || '')
      .replace(/[^\w\s\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc\u00df.,!?\-:;()\/]/g, '')
      .substring(0, 500)

    // Claude API aufrufen
    const prompt = `Du schreibst eine E-Mail im Namen der Steuerkanzlei "${kanzlei?.name || 'Ihre Kanzlei'}" an den Mandanten "${mandant?.name || 'Mandant'}".

Kontext:
- Checkliste: "${checkliste.titel}"
- Frist: ${frist} (${tageUebrig > 0 ? `noch ${tageUebrig} Tage` : `${Math.abs(tageUebrig)} Tage überfällig`})
- Bereits eingereicht (${erledigteDoks.length}): ${erledigteDoks.map((d: { titel: string }) => d.titel).join(', ') || 'Noch nichts'}
- Noch ausstehend (${offeneDoks.length}): ${offeneDoks.map((d: { titel: string }) => d.titel).join(', ') || 'Alles erledigt'}
- Letzte Erinnerung: ${letzteErinnerung ? new Date(letzteErinnerung.gesendet_am).toLocaleDateString('de-DE') : 'Noch keine gesendet'}
${safeAnweisungen ? `- Zusätzliche Hinweise vom Steuerberater: ${safeAnweisungen}` : ''}

Regeln:
- Freundlich, professionell, nicht zu lang (max 150 Wörter)
- Bedanke dich für bereits eingereichte Dokumente (wenn vorhanden)
- Nenne die noch fehlenden Dokumente konkret
- Erwähne die Frist
- Wenn überfällig: dringlicher Ton, aber höflich
- Kein "Sehr geehrte/r" — nutze "Guten Tag [Name]"
- Unterschreibe mit dem Kanzleinamen
- Kein HTML, kein Markdown — nur Plaintext

Antworte NUR mit dem E-Mail-Text, ohne Anführungszeichen oder Erklärungen.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      console.error('Claude API Fehler:', response.status)
      return new Response(
        JSON.stringify({ error: 'KI-Antwort nicht verfügbar' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const mailText = data.content?.[0]?.text || ''

    // Betreff generieren
    let betreff = `${kanzlei?.name || 'Ihre Kanzlei'}: `
    if (tageUebrig < 0) {
      betreff += `Dringend — ${checkliste.titel} ist überfällig`
    } else if (tageUebrig <= 3) {
      betreff += `Letzte Erinnerung — ${checkliste.titel}`
    } else if (tageUebrig <= 7) {
      betreff += `Erinnerung — ${checkliste.titel}`
    } else {
      betreff += `Unterlagen für ${checkliste.titel}`
    }

    return new Response(
      JSON.stringify({
        betreff,
        text: mailText,
        empfaenger: mandant?.email,
        mandantName: mandant?.name,
        offeneDokumente: offeneDoks.map((d: { titel: string }) => d.titel),
        erledigteDokumente: erledigteDoks.map((d: { titel: string }) => d.titel),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('ki-erinnerung Fehler:', err)
    return new Response(
      JSON.stringify({ error: 'Erinnerung konnte nicht generiert werden' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
