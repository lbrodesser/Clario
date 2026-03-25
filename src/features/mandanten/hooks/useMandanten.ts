import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import type { Mandant, Mitarbeiter, MandantTyp } from '@/shared/types'

export function useMandanten() {
  return useQuery({
    queryKey: ['mandanten'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandanten')
        .select('*')
        .order('name')

      if (error) throw error
      return data as Mandant[]
    },
  })
}

export function useMandant(id: string) {
  return useQuery({
    queryKey: ['mandant', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandanten')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Mandant
    },
  })
}

export function useMitarbeiter(mandantId: string) {
  return useQuery({
    queryKey: ['mitarbeiter', mandantId],
    enabled: !!mandantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mitarbeiter')
        .select('*')
        .eq('mandant_id', mandantId)
        .order('nachname')

      if (error) throw error
      return data as Mitarbeiter[]
    },
  })
}

interface MandantErstellen {
  name: string
  email: string
  typ: MandantTyp
  steuer_id?: string
  notizen?: string
  ist_heilberuf?: boolean
}

export function useMandantErstellen() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (daten: MandantErstellen) => {
      // Kanzlei-ID ermitteln
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht angemeldet')

      const { data: kanzlei } = await supabase
        .from('kanzleien')
        .select('id')
        .eq('email', user.email)
        .single()

      if (!kanzlei) throw new Error('Kanzlei nicht gefunden')

      const { data, error } = await supabase
        .from('mandanten')
        .insert({ ...daten, kanzlei_id: kanzlei.id })
        .select()
        .single()

      if (error) throw error
      return data as Mandant
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mandanten'] })
    },
  })
}

export function useMandantAktualisieren() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...daten }: Partial<Mandant> & { id: string }) => {
      const { data, error } = await supabase
        .from('mandanten')
        .update(daten)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Mandant
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mandant', data.id] })
      queryClient.invalidateQueries({ queryKey: ['mandanten'] })
    },
  })
}
