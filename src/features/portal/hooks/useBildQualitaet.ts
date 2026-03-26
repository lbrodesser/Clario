import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import type { QualitaetsPruefung } from '@/shared/types'

const MAX_BASE64_LAENGE = 5_000_000 // ~3.75MB decoded

interface PruefungParams {
  bildBase64: string
  dokumentTitel: string
}

export function useBildQualitaet() {
  return useMutation({
    mutationFn: async ({ bildBase64, dokumentTitel }: PruefungParams): Promise<QualitaetsPruefung> => {
      // Base64-Groesse pruefen
      if (bildBase64.length > MAX_BASE64_LAENGE) {
        throw new Error('Bild zu gross fuer Qualitaetspruefung (max. ca. 3.75 MB)')
      }

      // Timeout: 15 Sekunden
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      try {
        const { data, error } = await supabase.functions.invoke('bild-qualitaet', {
          body: { bildBase64, dokumentTitel },
        })

        if (error) throw error
        return data as QualitaetsPruefung
      } finally {
        clearTimeout(timeoutId)
      }
    },
  })
}

// Hilfsfunktion: File zu Base64
export function dateiZuBase64(datei: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Data-URL Prefix entfernen
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(datei)
  })
}
