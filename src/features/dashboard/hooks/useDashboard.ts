import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { ampelFarbe, fortschrittBerechnen, tagesBisFrist } from '@/shared/lib/utils'
import type { Kanzlei, MandantMitStatus, ChecklisteMitDokumente, DokumentMitDateien, FreierUpload, Mandant, Checkliste, Dokument, DokumentDatei } from '@/shared/types'

export function useKanzlei() {
  return useQuery({
    queryKey: ['kanzlei'],
    queryFn: async () => {
      const { data: kanzleiId, error: rpcError } = await supabase.rpc('meine_kanzlei_id')
      if (rpcError || !kanzleiId) throw new Error('Nicht angemeldet')

      const { data, error } = await supabase
        .from('kanzleien')
        .select('*')
        .eq('id', kanzleiId)
        .single()

      if (error) throw error
      return data as Kanzlei
    },
  })
}

// Nested Select Typen
interface MandantMitRelationen extends Mandant {
  checklisten: (Checkliste & {
    dokumente: (Dokument & {
      dokument_dateien: DokumentDatei[]
    })[]
  })[]
}

export function useMandantenMitStatus() {
  const { data: kanzlei } = useKanzlei()

  return useQuery({
    queryKey: ['mandanten-mit-status', kanzlei?.id],
    enabled: !!kanzlei,
    queryFn: async () => {
      // EINE Query statt hunderte (Nested Select)
      const { data, error } = await supabase
        .from('mandanten')
        .select(`
          *,
          checklisten (
            *,
            dokumente (
              *,
              dokument_dateien (*)
            )
          )
        `)
        .eq('kanzlei_id', kanzlei!.id)

      if (error) throw error

      const mandanten = data as unknown as MandantMitRelationen[]

      return mandanten.map((mandant): MandantMitStatus => {
        let offeneDoks = 0
        let letzteAktivitaet: string | null = null

        const checklistenMitDoks: ChecklisteMitDokumente[] = (mandant.checklisten ?? []).map((cl) => {
          const doks = cl.dokumente ?? []

          const dokumenteMitDateien: DokumentMitDateien[] = doks.map((dok) => {
            const dateien = (dok.dokument_dateien ?? []).sort(
              (a, b) => new Date(b.hochgeladen_am).getTime() - new Date(a.hochgeladen_am).getTime()
            )

            if (dok.pflicht && dok.status === 'ausstehend') offeneDoks++
            if (dateien.length > 0) {
              const letztesUpload = dateien[0].hochgeladen_am
              if (!letzteAktivitaet || letztesUpload > letzteAktivitaet) {
                letzteAktivitaet = letztesUpload
              }
            }

            return { ...dok, dateien }
          })

          return {
            ...cl,
            dokumente: dokumenteMitDateien.sort((a, b) => a.sortierung - b.sortierung),
            fortschritt: fortschrittBerechnen(doks),
            tage_bis_frist: tagesBisFrist(cl.frist),
          }
        })

        // Ampel: schlimmste Farbe aller Checklisten
        let mandantAmpel = checklistenMitDoks.length === 0
          ? 'gruen' as const
          : ampelFarbe(checklistenMitDoks[0].status, checklistenMitDoks[0].frist, kanzlei!)

        for (const cl of checklistenMitDoks) {
          const farbe = ampelFarbe(cl.status, cl.frist, kanzlei!)
          if (farbe === 'rot') mandantAmpel = 'rot'
          else if (farbe === 'gelb' && mandantAmpel === 'gruen') mandantAmpel = 'gelb'
        }

        return {
          ...mandant,
          checklisten: checklistenMitDoks,
          ampel: mandantAmpel,
          offene_dokumente: offeneDoks,
          letzte_aktivitaet: letzteAktivitaet,
        }
      })
    },
  })
}

export function useFreieUploads() {
  return useQuery({
    queryKey: ['freie-uploads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('freie_uploads')
        .select('*')
        .is('zugeordnet_am', null)
        .order('hochgeladen_am', { ascending: false })

      if (error) throw error
      return data as FreierUpload[]
    },
  })
}
