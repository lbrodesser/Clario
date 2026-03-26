import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { fortschrittBerechnen, tagesBisFrist } from '@/shared/lib/utils'
import type { Checkliste, ChecklisteMitDokumente, DokumentMitDateien, Kanzlei, Mandant } from '@/shared/types'

interface PortalDaten {
  kanzlei: Kanzlei
  mandant: Mandant
  checkliste: ChecklisteMitDokumente
}

export function usePortalDaten(token: string) {
  return useQuery({
    queryKey: ['portal', token],
    enabled: !!token,
    queryFn: async (): Promise<PortalDaten> => {
      // Checkliste per Token laden
      const { data: checkliste, error: clError } = await supabase
        .from('checklisten')
        .select('*')
        .eq('portal_token', token)
        .single()

      if (clError || !checkliste) throw new Error('Checkliste nicht gefunden')

      // Mandant laden
      const { data: mandant, error: mError } = await supabase
        .from('mandanten')
        .select('*')
        .eq('id', (checkliste as Checkliste).mandant_id)
        .single()

      if (mError || !mandant) throw new Error('Mandant nicht gefunden')

      // Kanzlei laden
      const { data: kanzlei, error: kError } = await supabase
        .from('kanzleien')
        .select('*')
        .eq('id', (mandant as Mandant).kanzlei_id)
        .single()

      if (kError || !kanzlei) throw new Error('Kanzlei nicht gefunden')

      // Dokumente laden
      const { data: dokumente } = await supabase
        .from('dokumente')
        .select('*')
        .eq('checkliste_id', (checkliste as Checkliste).id)
        .order('sortierung')

      const doks = dokumente ?? []
      const dokumenteMitDateien: DokumentMitDateien[] = []
      const k = kanzlei as Kanzlei

      for (const dok of doks) {
        const { data: dateien } = await supabase
          .from('dokument_dateien')
          .select('*')
          .eq('dokument_id', dok.id)
          .order('hochgeladen_am', { ascending: false })

        // Vorlage-PDF-URL dynamisch aus Kanzlei befuellen wenn im Dokument nicht gesetzt
        let vorlagePdfUrl = dok.vorlage_pdf_url
        if (!vorlagePdfUrl && dok.unterschrift_erforderlich) {
          if (dok.titel.toLowerCase().includes('vollmacht')) {
            vorlagePdfUrl = k.vollmacht_vorlage_url ?? null
          } else if (dok.titel.toLowerCase().includes('datenschutz')) {
            vorlagePdfUrl = k.datenschutz_vorlage_url ?? null
          }
        }

        dokumenteMitDateien.push({
          ...dok,
          vorlage_pdf_url: vorlagePdfUrl,
          dateien: dateien ?? [],
        })
      }

      const cl = checkliste as Checkliste

      return {
        kanzlei: kanzlei as Kanzlei,
        mandant: mandant as Mandant,
        checkliste: {
          ...cl,
          dokumente: dokumenteMitDateien,
          fortschritt: fortschrittBerechnen(doks),
          tage_bis_frist: tagesBisFrist(cl.frist),
        },
      }
    },
  })
}
