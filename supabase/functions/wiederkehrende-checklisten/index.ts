import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Naechstes Datum basierend auf Intervall berechnen
function naechstesDatum(basis: string, intervall: string): string {
  const d = new Date(basis)
  if (intervall === 'monatlich') d.setMonth(d.getMonth() + 1)
  else if (intervall === 'quartalsweise') d.setMonth(d.getMonth() + 3)
  else if (intervall === 'jaehrlich') d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

// Frist basierend auf Intervall berechnen (Ende des Zeitraums)
function fristBerechnen(erstellDatum: string, intervall: string): string {
  const d = new Date(erstellDatum)
  if (intervall === 'monatlich') {
    d.setMonth(d.getMonth() + 1)
    d.setDate(d.getDate() - 1)
  } else if (intervall === 'quartalsweise') {
    d.setMonth(d.getMonth() + 3)
    d.setDate(d.getDate() - 1)
  } else if (intervall === 'jaehrlich') {
    d.setFullYear(d.getFullYear() + 1)
    d.setDate(d.getDate() - 1)
  }
  return d.toISOString().split('T')[0]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const heute = new Date().toISOString().split('T')[0]

    // Wiederkehrende Checklisten finden deren naechste_erstellung faellig ist
    const { data: faellige, error: queryError } = await supabase
      .from('checklisten')
      .select('*')
      .eq('typ', 'wiederkehrend')
      .not('wiederholung_intervall', 'is', null)
      .not('naechste_erstellung', 'is', null)
      .lte('naechste_erstellung', heute)

    if (queryError) throw queryError
    if (!faellige || faellige.length === 0) {
      return new Response(
        JSON.stringify({ erstellt: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let erstellt = 0

    for (const checkliste of faellige) {
      // Dokumente der alten Checkliste als Vorlage laden
      const { data: alteDokumente } = await supabase
        .from('dokumente')
        .select('*')
        .eq('checkliste_id', checkliste.id)
        .order('sortierung')

      // Neue Checkliste erstellen
      const neueFrist = fristBerechnen(checkliste.naechste_erstellung, checkliste.wiederholung_intervall)
      const { data: neueCheckliste, error: insertError } = await supabase
        .from('checklisten')
        .insert({
          mandant_id: checkliste.mandant_id,
          titel: checkliste.titel,
          typ: 'wiederkehrend',
          frist: neueFrist,
          wiederholung_intervall: checkliste.wiederholung_intervall,
          naechste_erstellung: naechstesDatum(checkliste.naechste_erstellung, checkliste.wiederholung_intervall),
          freie_uploads_erlaubt: checkliste.freie_uploads_erlaubt,
          erstellt_von_vorlage_id: checkliste.erstellt_von_vorlage_id,
        })
        .select()
        .single()

      if (insertError || !neueCheckliste) continue

      // Dokumente kopieren (ohne Antworten/Dateien)
      if (alteDokumente && alteDokumente.length > 0) {
        const neueDokumente = alteDokumente.map((d) => ({
          checkliste_id: neueCheckliste.id,
          titel: d.titel,
          beschreibung: d.beschreibung,
          tipp_basis: d.tipp_basis,
          pflicht: d.pflicht,
          eingabe_typ: d.eingabe_typ,
          richtung: d.richtung,
          einheit: d.einheit,
          zahl_min: d.zahl_min,
          zahl_max: d.zahl_max,
          text_format: d.text_format,
          text_placeholder: d.text_placeholder,
          auswahl_optionen: d.auswahl_optionen,
          kombination_typen: d.kombination_typen,
          beleg_pflicht_ab_betrag: d.beleg_pflicht_ab_betrag,
          foto_erlaubt: d.foto_erlaubt,
          mehrdatei_erlaubt: d.mehrdatei_erlaubt,
          xml_erlaubt: d.xml_erlaubt,
          sortierung: d.sortierung,
          vorlage_dokument_id: d.vorlage_dokument_id,
        }))

        await supabase.from('dokumente').insert(neueDokumente)
      }

      // Alte Checkliste: naechste_erstellung auf null setzen (ist abgearbeitet)
      await supabase
        .from('checklisten')
        .update({ naechste_erstellung: null })
        .eq('id', checkliste.id)

      erstellt++
    }

    return new Response(
      JSON.stringify({ erstellt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: 'Fehler bei der Erstellung wiederkehrender Checklisten' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
