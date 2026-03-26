import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { fortschrittBerechnen, tagesBisFrist } from '@/shared/lib/utils'
import type { ChecklisteMitDokumente, DokumentMitDateien, Kanzlei, Mandant, Dokument, DokumentDatei } from '@/shared/types'

interface PortalDaten {
  kanzlei: Kanzlei
  mandant: Mandant
  checkliste: ChecklisteMitDokumente
}

// Supabase Nested Select Ergebnis
interface ChecklisteMitRelationen {
  id: string
  mandant_id: string
  titel: string
  typ: string
  frist: string
  status: string
  portal_token: string
  wiederholung_intervall: string | null
  naechste_erstellung: string | null
  freie_uploads_erlaubt: boolean
  created_at: string
  dokumente: (Dokument & { dokument_dateien: DokumentDatei[] })[]
  mandanten: Mandant & { kanzleien: Kanzlei }
}

export function usePortalDaten(token: string) {
  return useQuery({
    queryKey: ['portal', token],
    enabled: !!token,
    queryFn: async (): Promise<PortalDaten> => {
      // Alles in einer Query laden (statt N+1)
      const { data, error } = await supabase
        .from('checklisten')
        .select(`
          *,
          dokumente (
            *,
            dokument_dateien (*)
          ),
          mandanten!inner (
            *,
            kanzleien!inner (*)
          )
        `)
        .eq('portal_token', token)
        .single()

      if (error || !data) throw new Error('Checkliste nicht gefunden')

      const result = data as unknown as ChecklisteMitRelationen

      // Token-Validierung
      if (result.portal_token !== token) {
        throw new Error('Ungueltiger Zugangslink')
      }

      const kanzlei = result.mandanten.kanzleien
      const mandant = result.mandanten

      // Dokumente mit dynamischer vorlage_pdf_url aufbereiten
      const dokumente = (result.dokumente ?? [])
        .sort((a, b) => a.sortierung - b.sortierung)

      const dokumenteMitDateien: DokumentMitDateien[] = dokumente.map((dok) => {
        let vorlagePdfUrl = dok.vorlage_pdf_url ?? null
        if (!vorlagePdfUrl && dok.unterschrift_erforderlich) {
          if (dok.titel.toLowerCase().includes('vollmacht')) {
            vorlagePdfUrl = kanzlei.vollmacht_vorlage_url ?? null
          } else if (dok.titel.toLowerCase().includes('datenschutz')) {
            vorlagePdfUrl = kanzlei.datenschutz_vorlage_url ?? null
          }
        }

        const dateien = (dok.dokument_dateien ?? [])
          .sort((a, b) => new Date(b.hochgeladen_am).getTime() - new Date(a.hochgeladen_am).getTime())

        return {
          ...dok,
          vorlage_pdf_url: vorlagePdfUrl,
          dateien,
        }
      })

      return {
        kanzlei: kanzlei as Kanzlei,
        mandant: mandant as Mandant,
        checkliste: {
          id: result.id,
          mandant_id: result.mandant_id,
          titel: result.titel,
          typ: result.typ,
          frist: result.frist,
          status: result.status,
          portal_token: result.portal_token,
          wiederholung_intervall: result.wiederholung_intervall,
          naechste_erstellung: result.naechste_erstellung,
          freie_uploads_erlaubt: result.freie_uploads_erlaubt,
          created_at: result.created_at,
          dokumente: dokumenteMitDateien,
          fortschritt: fortschrittBerechnen(dokumente),
          tage_bis_frist: tagesBisFrist(result.frist),
        } as ChecklisteMitDokumente,
      }
    },
  })
}
