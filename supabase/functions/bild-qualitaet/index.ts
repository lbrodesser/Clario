import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bildBase64, dokumentTitel } = await req.json()

    if (!bildBase64 || !dokumentTitel) {
      return new Response(
        JSON.stringify({ error: 'bildBase64 und dokumentTitel sind erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
              text: `Du pruefst ein Foto eines Steuerdokuments ('${dokumentTitel}'). Pruefe NUR Bildqualitaet, nicht den Inhalt. Antworte NUR mit JSON ohne Markdown: { "bestanden": boolean, "grund": string|null, "hinweis": string|null } NICHT bestanden wenn: unscharf, Ecken fehlen, zu dunkel, starke Spiegelung, erkennbar falsches Dokument, leeres Blatt. Hinweis muss konkret und auf Deutsch sein.`,
            },
          ],
        }],
      }),
    })

    const data = await response.json()
    const text = data.content[0].text
    const result = JSON.parse(text)

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
