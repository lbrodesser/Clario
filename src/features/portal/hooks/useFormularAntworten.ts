import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import type { FormularFrage } from '@/shared/types'

interface FormularAntwort {
  id: string
  frage_id: string
  checkliste_id: string
  antwort_text: string | null
  antwort_zahl: number | null
  antwort_datei_url: string | null
  erstellt_am: string
}

// Fragen fuer ein Dokument laden
export function useFormularFragen(dokumentId: string) {
  return useQuery({
    queryKey: ['formular-fragen', dokumentId],
    enabled: !!dokumentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formular_fragen')
        .select('*')
        .eq('dokument_id', dokumentId)
        .order('sortierung')

      if (error) throw error
      return data as FormularFrage[]
    },
  })
}

// Bestehende Antworten fuer eine Checkliste laden
export function useFormularAntworten(checklisteId: string, dokumentId: string) {
  return useQuery({
    queryKey: ['formular-antworten', checklisteId, dokumentId],
    enabled: !!checklisteId && !!dokumentId,
    queryFn: async () => {
      // Erst Frage-IDs fuer dieses Dokument laden
      const { data: fragen } = await supabase
        .from('formular_fragen')
        .select('id')
        .eq('dokument_id', dokumentId)

      if (!fragen || fragen.length === 0) return [] as FormularAntwort[]

      const frageIds = fragen.map((f) => f.id)

      const { data, error } = await supabase
        .from('formular_antworten')
        .select('*')
        .eq('checkliste_id', checklisteId)
        .in('frage_id', frageIds)

      if (error) throw error
      return data as FormularAntwort[]
    },
  })
}

interface AntwortSpeichernParams {
  frageId: string
  checklisteId: string
  portalToken: string
  dokumentId: string
  antwortText?: string
  antwortZahl?: number
}

export function useAntwortSpeichern() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ frageId, checklisteId, antwortText, antwortZahl }: AntwortSpeichernParams) => {
      // Bestehende Antwort pruefen
      const { data: bestehend } = await supabase
        .from('formular_antworten')
        .select('id')
        .eq('frage_id', frageId)
        .eq('checkliste_id', checklisteId)
        .maybeSingle()

      if (bestehend) {
        // Update
        const { error } = await supabase
          .from('formular_antworten')
          .update({
            antwort_text: antwortText ?? null,
            antwort_zahl: antwortZahl ?? null,
          })
          .eq('id', bestehend.id)

        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase
          .from('formular_antworten')
          .insert({
            frage_id: frageId,
            checkliste_id: checklisteId,
            antwort_text: antwortText ?? null,
            antwort_zahl: antwortZahl ?? null,
          })

        if (error) throw error
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['formular-antworten', variables.checklisteId, variables.dokumentId],
      })
      queryClient.invalidateQueries({ queryKey: ['portal', variables.portalToken] })
    },
  })
}
