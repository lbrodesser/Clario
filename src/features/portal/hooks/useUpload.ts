import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'

// Erlaubte Dateitypen und Groessenlimits
const ERLAUBTE_TYPEN = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'text/xml',
  'application/xml',
]

const MAX_GROESSE_BYTES: Record<string, number> = {
  'application/pdf': 10 * 1024 * 1024,
  'image/jpeg': 5 * 1024 * 1024,
  'image/png': 5 * 1024 * 1024,
  'image/heic': 5 * 1024 * 1024,
  'image/heif': 5 * 1024 * 1024,
  'text/xml': 5 * 1024 * 1024,
  'application/xml': 5 * 1024 * 1024,
}

// Magic Bytes fuer Dateityp-Validierung
async function pruefeDatei(datei: File): Promise<void> {
  // MIME-Type pruefen
  if (!ERLAUBTE_TYPEN.includes(datei.type)) {
    throw new Error(`Dateityp "${datei.type || 'unbekannt'}" nicht erlaubt. Erlaubt: PDF, JPG, PNG, XML`)
  }

  // Dateigroesse pruefen
  const maxGroesse = MAX_GROESSE_BYTES[datei.type] ?? 5 * 1024 * 1024
  if (datei.size > maxGroesse) {
    throw new Error(
      `Datei zu gross (${(datei.size / 1024 / 1024).toFixed(1)} MB). Maximum: ${maxGroesse / 1024 / 1024} MB`
    )
  }

  // Magic Bytes pruefen (erste 4 Bytes)
  const header = await datei.slice(0, 4).arrayBuffer()
  const bytes = new Uint8Array(header)

  if (datei.type === 'application/pdf') {
    // %PDF
    if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
      throw new Error('Datei ist kein echtes PDF')
    }
  } else if (datei.type === 'image/jpeg') {
    // FF D8
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
      throw new Error('Datei ist kein echtes JPEG')
    }
  } else if (datei.type === 'image/png') {
    // 89 50 4E 47
    if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) {
      throw new Error('Datei ist kein echtes PNG')
    }
  }
  // HEIC und XML haben keine zuverlaessigen Magic Bytes — MIME-Type reicht
}

interface UploadParams {
  dokumentId: string
  datei: File
  portalToken: string
  qualitaetBestanden?: boolean
  qualitaetHinweis?: string
  qualitaetTrotzdem?: boolean
  istSigniert?: boolean
  signaturZeitpunkt?: string | null
  signaturIp?: string | null
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
      istSigniert,
      signaturZeitpunkt,
      signaturIp,
    }: UploadParams) => {
      // Datei validieren
      await pruefeDatei(datei)

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
          ist_signiert: istSigniert ?? false,
          signatur_zeitpunkt: signaturZeitpunkt ?? null,
          signatur_ip: signaturIp ?? null,
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
      // Datei validieren
      await pruefeDatei(datei)

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
