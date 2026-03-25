import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import type { DokumentMitDateien, FreierUpload } from '@/shared/types'

export function useDokumenteEingang() {
  return useQuery({
    queryKey: ['dokumente-eingang'],
    queryFn: async () => {
      const { data: dokumente, error } = await supabase
        .from('dokumente')
        .select('*')
        .in('status', ['hochgeladen'])
        .order('created_at', { ascending: false })

      if (error) throw error

      const result: DokumentMitDateien[] = []
      for (const dok of dokumente) {
        const { data: dateien } = await supabase
          .from('dokument_dateien')
          .select('*')
          .eq('dokument_id', dok.id)
          .order('hochgeladen_am', { ascending: false })

        result.push({ ...dok, dateien: dateien ?? [] })
      }

      return result
    },
  })
}

export function useFreieUploadsListe() {
  return useQuery({
    queryKey: ['freie-uploads-liste'],
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

export function useDokumentAlsGeprueft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dokumentId: string) => {
      const { error } = await supabase
        .from('dokumente')
        .update({ status: 'geprueft' })
        .eq('id', dokumentId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dokumente-eingang'] })
    },
  })
}

export function useFreienUploadZuordnen() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ uploadId, dokumentId }: { uploadId: string; dokumentId: string }) => {
      const { error } = await supabase
        .from('freie_uploads')
        .update({
          zugeordnet_am: new Date().toISOString(),
          zugeordnet_zu_dokument_id: dokumentId,
        })
        .eq('id', uploadId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freie-uploads-liste'] })
    },
  })
}
