import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { checklisteId, typ } = await req.json()

    if (!checklisteId || !typ) {
      return new Response(
        JSON.stringify({ error: 'checklisteId und typ sind erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendKey = Deno.env.get('RESEND_API_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Checkliste laden
    const { data: checkliste, error: clError } = await supabase
      .from('checklisten')
      .select('*')
      .eq('id', checklisteId)
      .single()

    if (clError || !checkliste) {
      return new Response(
        JSON.stringify({ error: 'Checkliste nicht gefunden' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mandant laden
    const { data: mandant } = await supabase
      .from('mandanten')
      .select('*')
      .eq('id', checkliste.mandant_id)
      .single()

    if (!mandant) {
      return new Response(
        JSON.stringify({ error: 'Mandant nicht gefunden' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Kanzlei laden
    const { data: kanzlei } = await supabase
      .from('kanzleien')
      .select('*')
      .eq('id', mandant.kanzlei_id)
      .single()

    if (!kanzlei) {
      return new Response(
        JSON.stringify({ error: 'Kanzlei nicht gefunden' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fortschritt berechnen
    const { data: dokumente } = await supabase
      .from('dokumente')
      .select('status, pflicht')
      .eq('checkliste_id', checklisteId)

    const pflicht = (dokumente || []).filter((d: { pflicht: boolean }) => d.pflicht)
    const erledigt = pflicht.filter(
      (d: { status: string }) => d.status === 'hochgeladen' || d.status === 'geprueft'
    ).length

    const portalLink = `${Deno.env.get('APP_URL') || 'https://app.clario.de'}/portal/${checkliste.portal_token}`

    // E-Mail senden via Resend
    if (resendKey) {
      const frist = new Date(checkliste.frist).toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      })

      const istGwG = checkliste.titel.toLowerCase().includes('gwg')

      const betreffMap: Record<string, string> = {
        einladung: istGwG
          ? `${kanzlei.name}: Bitte identifizieren Sie sich fuer Ihr Mandat`
          : `${kanzlei.name}: Ihre Unterlagen werden benoetigt`,
        '14-tage': `Erinnerung: Noch 14 Tage fuer ${checkliste.titel}`,
        '7-tage': `Erinnerung: Noch 7 Tage fuer ${checkliste.titel}`,
        '3-tage': `Letzte Erinnerung: ${checkliste.titel}`,
        frist: `Heute faellig: ${checkliste.titel}`,
        manuell: `${kanzlei.name}: Erinnerung an ${checkliste.titel}`,
      }

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: `${kanzlei.name} <noreply@clario.de>`,
          to: mandant.email,
          subject: betreffMap[typ] || `${kanzlei.name}: Unterlagen benoetigt`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>${kanzlei.name}</h2>
              <p>Guten Tag ${mandant.name},</p>
              <p>fuer <strong>${checkliste.titel}</strong> benoetigen wir noch Unterlagen von Ihnen.</p>
              ${istGwG && typ === 'einladung' ? `
              <div style="margin: 16px 0; padding: 16px; background-color: #f8fafc; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; font-weight: bold;">Fuer die Aufnahme Ihres Mandats benoetigen wir folgende Unterlagen:</p>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Personalausweis (Vorder- und Rueckseite)</li>
                  <li>Ihre Unterschrift auf unserer Vollmacht</li>
                  <li>Ihre Unterschrift auf unserer Datenschutzerklaerung</li>
                </ul>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">Sie koennen alle Dokumente bequem online einreichen — kein Ausdrucken noetig.</p>
              </div>
              ` : ''}
              <p><strong>Frist: ${frist}</strong></p>
              <p>Sie haben bereits ${erledigt} von ${pflicht.length} Pflichtdokumenten eingereicht.</p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${portalLink}" style="display: inline-block; padding: 16px 32px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                  Jetzt Unterlagen einreichen
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Kein Account noetig. Einfach klicken.</p>
            </div>
          `,
        }),
      })

      if (!emailResponse.ok) {
        const errorBody = await emailResponse.text()
        console.error('Resend API Fehler:', emailResponse.status, errorBody)
        return new Response(
          JSON.stringify({ success: false, error: 'E-Mail konnte nicht gesendet werden' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Erinnerung loggen
    await supabase.from('erinnerungen_log').insert({
      checkliste_id: checklisteId,
      typ,
      gesendet_an: mandant.email,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: 'E-Mail konnte nicht gesendet werden' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
