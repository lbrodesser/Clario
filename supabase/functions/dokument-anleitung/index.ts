import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    // Rate Limiting: 10 Anfragen pro Minute pro IP
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(clientIp, 10, 60000)) {
      return new Response(
        JSON.stringify({ error: 'Zu viele Anfragen. Bitte warten Sie einen Moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { dokumentTitel, tippBasis, mandantTyp } = await req.json()

    if (!dokumentTitel || typeof dokumentTitel !== 'string') {
      return new Response(
        JSON.stringify({ error: 'dokumentTitel ist erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prompt Injection verhindern: Inputs sanitizen
    const safeTitel = dokumentTitel
      .replace(/[^\w\säöüÄÖÜß\-\.\/()]/g, '')
      .substring(0, 100)

    const safeTipp = (tippBasis || '')
      .replace(/[^\w\säöüÄÖÜß\-\.\/(),:%€]/g, '')
      .substring(0, 200)

    const safeTyp = (mandantTyp || 'privatperson')
      .replace(/[^\w]/g, '')
      .substring(0, 30)

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Konfigurationsfehler' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Du hilfst einem Mandanten einer deutschen Steuerkanzlei.
Dokument gesucht: '${safeTitel}'
Mandantentyp: ${safeTyp}
Basis-Info: ${safeTipp || 'Keine zusaetzlichen Informationen'}

Schreibe eine kurze Anleitung auf Deutsch fuer jemanden ohne Steuererfahrung. Kein Fachjargon. Konkret und direkt.
Antworte NUR mit JSON ohne Markdown:
{
  "anleitung": "Ein Satz was dieses Dokument ist",
  "schritte": ["Schritt 1", "Schritt 2", "Schritt 3"],
  "alternativ": "Was tun wenn nicht gefunden (oder null)"
}
Nenn echte Portale, echte Wege. Z.B. 'Im Online-Banking unter Postfach > Jahresbescheinigungen'.`,
        }],
      }),
    })

    if (!response.ok) {
      console.error('Claude API Fehler:', response.status)
      return new Response(
        JSON.stringify({ error: 'Anleitung nicht verfuegbar' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const text = data.content?.[0]?.text

    // JSON-Parse absichern
    let result
    try {
      result = JSON.parse(text)
    } catch {
      console.error('Claude Antwort kein gueltiges JSON:', text?.substring(0, 200))
      result = {
        anleitung: 'Anleitung konnte nicht generiert werden.',
        schritte: ['Bitte fragen Sie Ihre Kanzlei direkt.'],
        alternativ: null,
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: 'Anleitung konnte nicht generiert werden' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
