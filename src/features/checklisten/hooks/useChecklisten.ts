import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { fortschrittBerechnen, tagesBisFrist } from '@/shared/lib/utils'
import type { Checkliste, ChecklisteMitDokumente, DokumentMitDateien, VorlageCheckliste, VorlageDokument, MandantTyp } from '@/shared/types'

export function useChecklisten(mandantId: string) {
  return useQuery({
    queryKey: ['checklisten', mandantId],
    enabled: !!mandantId,
    queryFn: async () => {
      const { data: checklisten, error } = await supabase
        .from('checklisten')
        .select('*')
        .eq('mandant_id', mandantId)
        .order('frist')

      if (error) throw error

      const result: ChecklisteMitDokumente[] = []

      for (const cl of checklisten as Checkliste[]) {
        const { data: dokumente } = await supabase
          .from('dokumente')
          .select('*')
          .eq('checkliste_id', cl.id)
          .order('sortierung')

        const doks = dokumente ?? []
        const dokumenteMitDateien: DokumentMitDateien[] = []

        for (const dok of doks) {
          const { data: dateien } = await supabase
            .from('dokument_dateien')
            .select('*')
            .eq('dokument_id', dok.id)
            .order('hochgeladen_am', { ascending: false })

          dokumenteMitDateien.push({ ...dok, dateien: dateien ?? [] })
        }

        result.push({
          ...cl,
          dokumente: dokumenteMitDateien,
          fortschritt: fortschrittBerechnen(doks),
          tage_bis_frist: tagesBisFrist(cl.frist),
        })
      }

      return result
    },
  })
}

export function useVorlagen(mandantTyp: MandantTyp) {
  return useQuery({
    queryKey: ['vorlagen', mandantTyp],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vorlage_checklisten')
        .select('*')
        .eq('mandant_typ', mandantTyp)
        .eq('ist_aktiv', true)

      if (error) throw error
      return data as VorlageCheckliste[]
    },
  })
}

export function useVorlageDokumente(vorlageId: string) {
  return useQuery({
    queryKey: ['vorlage-dokumente', vorlageId],
    enabled: !!vorlageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vorlage_dokumente')
        .select('*')
        .eq('vorlage_checkliste_id', vorlageId)
        .order('sortierung')

      if (error) throw error
      return data as VorlageDokument[]
    },
  })
}

interface ChecklisteErstellen {
  mandantId: string
  vorlageId: string
  titel: string
  frist: string
}

export function useChecklisteErstellen() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ mandantId, vorlageId, titel, frist }: ChecklisteErstellen) => {
      // Checkliste erstellen
      const { data: checkliste, error: clError } = await supabase
        .from('checklisten')
        .insert({
          mandant_id: mandantId,
          titel,
          frist,
          erstellt_von_vorlage_id: vorlageId,
        })
        .select()
        .single()

      if (clError) throw clError

      // Vorlagen-Dokumente laden und kopieren
      const { data: vorlageDoks } = await supabase
        .from('vorlage_dokumente')
        .select('*')
        .eq('vorlage_checkliste_id', vorlageId)
        .order('sortierung')

      if (vorlageDoks && vorlageDoks.length > 0) {
        const dokumente = vorlageDoks.map((vd: VorlageDokument) => ({
          checkliste_id: checkliste.id,
          titel: vd.titel,
          beschreibung: vd.beschreibung,
          tipp_basis: vd.tipp_basis,
          pflicht: vd.pflicht,
          eingabe_typ: vd.eingabe_typ,
          einheit: vd.einheit,
          auswahl_optionen: vd.auswahl_optionen,
          kombination_typen: vd.kombination_typen,
          beleg_pflicht_ab_betrag: vd.beleg_pflicht_ab_betrag,
          foto_erlaubt: vd.foto_erlaubt,
          mehrdatei_erlaubt: vd.mehrdatei_erlaubt,
          xml_erlaubt: vd.xml_erlaubt,
          sortierung: vd.sortierung,
          vorlage_dokument_id: vd.id,
        }))

        const { error: dokError } = await supabase
          .from('dokumente')
          .insert(dokumente)

        if (dokError) throw dokError
      }

      return checkliste as Checkliste
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['checklisten', variables.mandantId] })
    },
  })
}

export function useErinnerungSenden() {
  return useMutation({
    mutationFn: async ({ checklisteId, typ }: { checklisteId: string; typ: string }) => {
      const { data, error } = await supabase.functions.invoke('magic-link-senden', {
        body: { checklisteId, typ },
      })

      if (error) throw error
      return data as { success: boolean }
    },
  })
}
