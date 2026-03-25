import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase'

interface LoginDaten {
  email: string
  passwort: string
}

interface RegisterDaten {
  email: string
  passwort: string
  kanzleiName: string
}

export function useLogin() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async ({ email, passwort }: LoginDaten) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: passwort,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      navigate('/app/dashboard')
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async ({ email, passwort, kanzleiName }: RegisterDaten) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: passwort,
      })
      if (error) throw error

      // Kanzlei-Eintrag erstellen
      if (data.user) {
        const { error: kanzleiError } = await supabase.from('kanzleien').insert({
          name: kanzleiName,
          email,
        })
        if (kanzleiError) throw kanzleiError
      }

      return data
    },
    onSuccess: () => {
      navigate('/app/dashboard')
    },
  })
}
