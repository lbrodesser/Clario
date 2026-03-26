import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'

interface KiErinnerungAntwort {
  betreff: string
  text: string
  empfaenger: string
  mandantName: string
  offeneDokumente: string[]
  erledigteDokumente: string[]
}

interface KiErinnerungParams {
  checklisteId: string
  anweisungen?: string
}

// Schritt 1: KI generiert Mail-Entwurf
export function useKiErinnerungGenerieren() {
  return useMutation({
    mutationFn: async ({ checklisteId, anweisungen }: KiErinnerungParams): Promise<KiErinnerungAntwort> => {
      const { data, error } = await supabase.functions.invoke('ki-erinnerung', {
        body: { checklisteId, anweisungen },
      })

      if (error) throw error
      return data as KiErinnerungAntwort
    },
  })
}

interface MailSendenParams {
  checklisteId: string
  betreff: string
  text: string
  empfaenger: string
}

// Schritt 2: Mail tatsaechlich senden (via magic-link-senden mit Custom-Text)
export function useKiMailSenden() {
  return useMutation({
    mutationFn: async ({ checklisteId, betreff, text, empfaenger }: MailSendenParams) => {
      // Resend direkt ueber Edge Function
      const { data, error } = await supabase.functions.invoke('magic-link-senden', {
        body: {
          checklisteId,
          typ: 'manuell',
          customBetreff: betreff,
          customText: text,
        },
      })

      if (error) throw error
      return data
    },
  })
}
