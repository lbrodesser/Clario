import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'

interface UploadParams {
  dokumentId: string
  datei: File
  portalToken: string
  qualitaetBestanden?: boolean
  qualitaetHinweis?: string
  qualitaetTrotzdem?: boolean
}

export function useUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      dokumentId,
      datei,
      portalToken,
      qualitaetBestanden,
      qualitaetHinweis,
      qualitaetTrotzdem,
    }: UploadParams) => {
      // Datei in Supabase Storage hochladen
      const dateiPfad = `${portalToken}/${dokumentId}/${Date.now()}_${datei.name}`
      const { error: uploadError } = await supabase.storage
        .from('dokumente')
        .upload(dateiPfad, datei)

      if (uploadError) throw uploadError

      // Oeffentliche URL generieren
      const { data: urlData } = supabase.storage
        .from('dokumente')
        .getPublicUrl(dateiPfad)

      // Datei-Eintrag erstellen
      const { error: dateiError } = await supabase
        .from('dokument_dateien')
        .insert({
          dokument_id: dokumentId,
          datei_url: urlData.publicUrl,
          dateiname: datei.name,
          dateityp: datei.type,
          dateigroesse_kb: Math.round(datei.size / 1024),
          qualitaet_geprueft: qualitaetBestanden !== undefined,
          qualitaet_bestanden: qualitaetBestanden ?? null,
          qualitaet_hinweis: qualitaetHinweis ?? null,
          qualitaet_trotzdem_hochgeladen: qualitaetTrotzdem ?? false,
        })

      if (dateiError) throw dateiError

      // Dokument-Status aktualisieren
      const { error: statusError } = await supabase
        .from('dokumente')
        .update({ status: 'hochgeladen' })
        .eq('id', dokumentId)

      if (statusError) throw statusError
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portal', variables.portalToken] })
    },
  })
}

interface WertSpeichernParams {
  dokumentId: string
  portalToken: string
  text?: string
  zahl?: number
}

export function useWertSpeichern() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ dokumentId, text, zahl }: WertSpeichernParams) => {
      const update: Record<string, unknown> = { status: 'hochgeladen' }
      if (text !== undefined) update.eingabe_wert_text = text
      if (zahl !== undefined) update.eingabe_wert_zahl = zahl

      const { error } = await supabase
        .from('dokumente')
        .update(update)
        .eq('id', dokumentId)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portal', variables.portalToken] })
    },
  })
}

interface FreierUploadParams {
  mandantId: string
  checklisteId: string
  datei: File
  beschreibung?: string
  portalToken: string
}

export function useFreierUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ mandantId, checklisteId, datei, beschreibung, portalToken }: FreierUploadParams) => {
      const dateiPfad = `freie/${portalToken}/${Date.now()}_${datei.name}`
      const { error: uploadError } = await supabase.storage
        .from('dokumente')
        .upload(dateiPfad, datei)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('dokumente')
        .getPublicUrl(dateiPfad)

      const { error } = await supabase.from('freie_uploads').insert({
        mandant_id: mandantId,
        checkliste_id: checklisteId,
        datei_url: urlData.publicUrl,
        dateiname: datei.name,
        dateityp: datei.type,
        dateigroesse_kb: Math.round(datei.size / 1024),
        beschreibung: beschreibung ?? null,
      })

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portal', variables.portalToken] })
    },
  })
}
