import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { ampelFarbe, fortschrittBerechnen, tagesBisFrist } from '@/shared/lib/utils'
import type { Kanzlei, MandantMitStatus, ChecklisteMitDokumente, DokumentMitDateien, FreierUpload } from '@/shared/types'

export function useKanzlei() {
  return useQuery({
    queryKey: ['kanzlei'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht angemeldet')

      const { data, error } = await supabase
        .from('kanzleien')
        .select('*')
        .eq('email', user.email)
        .single()

      if (error) throw error
      return data as Kanzlei
    },
  })
}

export function useMandantenMitStatus() {
  const { data: kanzlei } = useKanzlei()

  return useQuery({
    queryKey: ['mandanten-mit-status', kanzlei?.id],
    enabled: !!kanzlei,
    queryFn: async () => {
      const { data: mandanten, error: mandantenError } = await supabase
        .from('mandanten')
        .select('*')
        .eq('kanzlei_id', kanzlei!.id)

      if (mandantenError) throw mandantenError

      const result: MandantMitStatus[] = []

      for (const mandant of mandanten) {
        const { data: checklisten, error: checklistenError } = await supabase
          .from('checklisten')
          .select('*')
          .eq('mandant_id', mandant.id)

        if (checklistenError) throw checklistenError

        const checklistenMitDoks: ChecklisteMitDokumente[] = []
        let offeneDoks = 0
        let letzteAktivitaet: string | null = null

        for (const cl of checklisten) {
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

            const d: DokumentMitDateien = { ...dok, dateien: dateien ?? [] }
            dokumenteMitDateien.push(d)

            if (dok.pflicht && dok.status === 'ausstehend') offeneDoks++
            if (dateien && dateien.length > 0) {
              const letztesUpload = dateien[0].hochgeladen_am
              if (!letzteAktivitaet || letztesUpload > letzteAktivitaet) {
                letzteAktivitaet = letztesUpload
              }
            }
          }

          checklistenMitDoks.push({
            ...cl,
            dokumente: dokumenteMitDateien,
            fortschritt: fortschrittBerechnen(doks),
            tage_bis_frist: tagesBisFrist(cl.frist),
          })
        }

        // Ampel: schlimmste Farbe aller Checklisten
        let mandantAmpel = ampelFarbe(
          checklistenMitDoks[0]?.status ?? 'offen',
          checklistenMitDoks[0]?.frist ?? new Date().toISOString(),
          kanzlei!
        )
        for (const cl of checklistenMitDoks) {
          const farbe = ampelFarbe(cl.status, cl.frist, kanzlei!)
          if (farbe === 'rot') mandantAmpel = 'rot'
          else if (farbe === 'gelb' && mandantAmpel === 'gruen') mandantAmpel = 'gelb'
        }
        if (checklistenMitDoks.length === 0) mandantAmpel = 'gruen'

        result.push({
          ...mandant,
          checklisten: checklistenMitDoks,
          ampel: mandantAmpel,
          offene_dokumente: offeneDoks,
          letzte_aktivitaet: letzteAktivitaet,
        })
      }

      return result
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
