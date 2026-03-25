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
    const { dokumentTitel, tippBasis, mandantTyp } = await req.json()

    if (!dokumentTitel) {
      return new Response(
        JSON.stringify({ error: 'dokumentTitel ist erforderlich' }),
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
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Du hilfst einem Mandanten einer deutschen Steuerkanzlei.
Dokument gesucht: '${dokumentTitel}'
Mandantentyp: ${mandantTyp || 'privatperson'}
Basis-Info: ${tippBasis || 'Keine zusaetzlichen Informationen'}

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

    const data = await response.json()
    const text = data.content[0].text
    const result = JSON.parse(text)

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
