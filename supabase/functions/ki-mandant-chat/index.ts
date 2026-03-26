import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit } from '../_shared/rate-limit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// FAQ-Wissensdatenbank: Häufige Mandanten-Fragen und Kontext
const FAQ_WISSENSDATENBANK = `
Du bist der KI-Assistent einer deutschen Steuerkanzlei. Du hilfst Mandanten bei Rückfragen
zu ihren Dokumenten und Unterlagen. Du antwortest immer freundlich, kurz und verständlich.

WICHTIGE REGELN:
1. Du bist KEIN Steuerberater. Du gibst KEINE steuerliche oder juristische Beratung.
2. Bei juristischen, steuerlichen oder individuellen Fragen antwortest du:
   "Das ist eine individuelle Frage, die Ihr Steuerberater persönlich klären sollte.
   Ich leite Ihre Anfrage gerne weiter."
3. Du beantwortest nur organisatorische Fragen (wo finde ich was, wie lade ich hoch, etc.)
4. Antworte auf Deutsch, maximal 3-4 Sätze.
5. Sei konkret und nenne echte Wege (ELSTER, Online-Banking, Arbeitgeber, etc.)

HÄUFIGE FRAGEN UND ANTWORTEN:

Personalausweis:
- Vorder- und Rückseite separat fotografieren
- Bei guter Beleuchtung, alle Ecken sichtbar
- Alternativ: Reisepass

Lohnsteuerbescheinigung:
- Vom Arbeitgeber, meist im Februar/März für das Vorjahr
- Im Online-Gehaltsportal oder bei der Personalabteilung
- Auch im ELSTER-Konto unter "Bescheinigungen"

Steuerbescheid:
- Kommt vom Finanzamt per Post oder digital über ELSTER
- Unter "Mein ELSTER" > "Bescheide" abrufbar
- Falls verloren: Kopie beim Finanzamt anfordern

Vollmacht:
- Wird von der Kanzlei bereitgestellt
- Im Portal digital unterschreiben (kein Ausdrucken nötig)
- Gilt bis auf Widerruf

Datenschutzerklärung:
- Wird von der Kanzlei bereitgestellt
- Muss digital unterschrieben werden
- Gesetzliche Pflicht nach DSGVO

Kontoauszüge / Bankbelege:
- Im Online-Banking unter "Postfach" oder "Dokumente"
- Jahresbescheinigungen meist im Februar verfügbar
- PDF-Export bevorzugt

Upload-Probleme:
- Erlaubte Formate: PDF, JPG, PNG (max. 5-10 MB)
- Bei Kamera-Problemen: Datei-Upload als Alternative nutzen
- Bei technischen Problemen: Seite neu laden

Fristen:
- Die angezeigte Frist ist verbindlich
- Bei Fristverlängerung: Kanzlei direkt kontaktieren
- Verspätete Abgabe kann Zuschläge verursachen (steuerliche Frage → weiterleiten)
`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(clientIp, 15, 60000)) {
      return new Response(
        JSON.stringify({ antwort: 'Bitte warten Sie einen Moment bevor Sie weitere Fragen stellen.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { nachricht, portalToken, verlauf } = await req.json()

    if (!nachricht || typeof nachricht !== 'string' || !portalToken) {
      return new Response(
        JSON.stringify({ error: 'nachricht und portalToken sind erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Nachricht sanitizen
    const safeNachricht = nachricht.substring(0, 500)

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ antwort: 'Der Assistent ist gerade nicht verfügbar. Bitte kontaktieren Sie Ihre Kanzlei direkt.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Kontext laden
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: checkliste } = await supabase
      .from('checklisten')
      .select('titel, frist')
      .eq('portal_token', portalToken)
      .single()

    const { data: dokumente } = checkliste
      ? await supabase
          .from('dokumente')
          .select('titel, status, pflicht')
          .eq('checkliste_id', (checkliste as { id?: string }).id || '')
      : { data: [] }

    const offene = (dokumente || []).filter(
      (d: { status: string; pflicht: boolean }) => d.pflicht && d.status === 'ausstehend'
    )

    // Kontext-String
    const kontext = checkliste
      ? `\nAktuelle Checkliste: "${checkliste.titel}", Frist: ${checkliste.frist}
Offene Dokumente: ${offene.map((d: { titel: string }) => d.titel).join(', ') || 'Alle eingereicht'}`
      : ''

    // Chat-Verlauf aufbauen (max. letzte 6 Nachrichten)
    const chatVerlauf = Array.isArray(verlauf)
      ? verlauf.slice(-6).map((v: { rolle: string; text: string }) => ({
          role: v.rolle === 'mandant' ? 'user' : 'assistant',
          content: v.text.substring(0, 500),
        }))
      : []

    // Aktuelle Nachricht anhängen
    chatVerlauf.push({ role: 'user', content: safeNachricht })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: FAQ_WISSENSDATENBANK + kontext,
        messages: chatVerlauf,
      }),
    })

    if (!response.ok) {
      console.error('Claude API Fehler:', response.status)
      return new Response(
        JSON.stringify({ antwort: 'Der Assistent ist gerade nicht verfügbar. Bitte kontaktieren Sie Ihre Kanzlei direkt.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const antwort = data.content?.[0]?.text || 'Entschuldigung, ich konnte Ihre Frage nicht verarbeiten.'

    // Prüfen ob Eskalation nötig
    const brauchtEskalation = antwort.toLowerCase().includes('steuerberater') ||
      antwort.toLowerCase().includes('persönlich klären') ||
      antwort.toLowerCase().includes('weiterleiten')

    return new Response(
      JSON.stringify({
        antwort,
        eskalation: brauchtEskalation,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('ki-mandant-chat Fehler:', err)
    return new Response(
      JSON.stringify({ antwort: 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
