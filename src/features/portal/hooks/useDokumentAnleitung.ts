import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import type { DokumentAnleitung } from '@/shared/types'

interface AnleitungParams {
  dokumentTitel: string
  tippBasis: string
  mandantTyp: string
}

export function useDokumentAnleitung() {
  return useMutation({
    mutationFn: async ({ dokumentTitel, tippBasis, mandantTyp }: AnleitungParams): Promise<DokumentAnleitung> => {
      const { data, error } = await supabase.functions.invoke('dokument-anleitung', {
        body: { dokumentTitel, tippBasis, mandantTyp },
      })

      if (error) throw error
      return data as DokumentAnleitung
    },
  })
}
