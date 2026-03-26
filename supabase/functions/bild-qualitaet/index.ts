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
    // Rate Limiting: 5 Anfragen pro Minute pro IP
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(clientIp, 5, 60000)) {
      return new Response(
        JSON.stringify({ error: 'Zu viele Anfragen. Bitte warten Sie einen Moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { bildBase64, dokumentTitel } = await req.json()

    // Input-Validierung
    if (!bildBase64 || typeof bildBase64 !== 'string') {
      return new Response(
        JSON.stringify({ error: 'bildBase64 fehlt oder ist ungueltig' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (bildBase64.length > 5_000_000) {
      return new Response(
        JSON.stringify({ error: 'Bild zu gross (max. 3.75 MB)' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // dokumentTitel sanitizen (Prompt Injection verhindern)
    const safeTitel = (dokumentTitel || 'Dokument')
      .replace(/[^\w\säöüÄÖÜß\-\.\/()]/g, '')
      .substring(0, 100)

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
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: bildBase64 },
            },
            {
              type: 'text',
              text: `Du pruefst ein Foto eines Steuerdokuments ('${safeTitel}'). Pruefe NUR Bildqualitaet, nicht den Inhalt. Antworte NUR mit JSON ohne Markdown: { "bestanden": boolean, "grund": string|null, "hinweis": string|null } NICHT bestanden wenn: unscharf, Ecken fehlen, zu dunkel, starke Spiegelung, erkennbar falsches Dokument, leeres Blatt. Hinweis muss konkret und auf Deutsch sein.`,
            },
          ],
        }],
      }),
    })

    if (!response.ok) {
      console.error('Claude API Fehler:', response.status)
      return new Response(
        JSON.stringify({ bestanden: true, grund: null, hinweis: 'Qualitaetspruefung nicht verfuegbar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      result = { bestanden: true, grund: null, hinweis: 'Qualitaetspruefung konnte nicht ausgewertet werden' }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: 'Qualitaetspruefung fehlgeschlagen' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
