import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase'
import { toast } from '@/shared/hooks/useToast'

interface LoginDaten {
  email: string
  passwort: string
}

interface RegisterDaten {
  email: string
  passwort: string
  kanzleiName: string
}

// Prueft ob Kanzlei-Eintrag existiert, erstellt ihn falls nicht (Recovery)
async function sicherstelleKanzleiExistiert(email: string) {
  const { data: kanzleiId } = await supabase.rpc('meine_kanzlei_id')
  if (kanzleiId) return

  // Kanzlei fehlt — Recovery: automatisch anlegen
  const { error } = await supabase.from('kanzleien').insert({
    name: email.split('@')[0],
    email,
  })

  if (error) {
    console.error('Kanzlei-Recovery fehlgeschlagen:', error.message)
    throw new Error('Kontodaten konnten nicht vervollstaendigt werden. Bitte kontaktieren Sie den Support.')
  }

  toast({ titel: 'Ihr Konto wurde vervollstaendigt', variante: 'success' })
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

      // Recovery: Kanzlei-Eintrag pruefen und ggf. erstellen
      await sicherstelleKanzleiExistiert(email)

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
        options: {
          emailRedirectTo: `${window.location.origin}/app/dashboard`,
        },
      })
      if (error) throw error

      if (data.user) {
        const { error: kanzleiError } = await supabase.from('kanzleien').insert({
          name: kanzleiName,
          email,
        })

        if (kanzleiError) {
          // Auth-User existiert, aber Kanzlei-INSERT fehlgeschlagen
          // Recovery passiert beim naechsten Login via sicherstelleKanzleiExistiert()
          console.error('Kanzlei-Erstellung fehlgeschlagen:', kanzleiError.message)
          throw new Error(
            'Registrierung teilweise fehlgeschlagen. Bitte melden Sie sich an — Ihr Konto wird automatisch vervollstaendigt.'
          )
        }
      }

      return data
    },
    onSuccess: () => {
      navigate('/auth/verify')
    },
  })
}
