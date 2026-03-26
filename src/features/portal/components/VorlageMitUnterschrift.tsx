import { useState } from 'react'
import { Check, Download, AlertTriangle } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { Button } from '@/shared/components/ui/button'
import { SignaturPad } from './SignaturPad'
import { useUpload } from '../hooks/useUpload'
import type { DokumentMitDateien } from '@/shared/types'

interface VorlageMitUnterschriftProps {
  dokument: DokumentMitDateien
  portalToken: string
  mandantName: string
  kanzleiName: string
}

export function VorlageMitUnterschrift({
  dokument,
  portalToken,
  mandantName,
  kanzleiName,
}: VorlageMitUnterschriftProps) {
  const upload = useUpload()
  const [isProcessing, setIsProcessing] = useState(false)
  const [pdfFehler, setPdfFehler] = useState<string | null>(null)

  // Bereits signiert
  const signiereDatei = dokument.dateien.find((d) => d.ist_signiert)
  if (signiereDatei) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-ampel-gruen/10 p-4">
        <Check className="h-5 w-5 text-ampel-gruen shrink-0" />
        <div>
          <p className="text-sm font-medium text-ampel-gruen">
            Unterschrieben am{' '}
            {signiereDatei.signatur_zeitpunkt
              ? new Date(signiereDatei.signatur_zeitpunkt).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : new Date(signiereDatei.hochgeladen_am).toLocaleDateString('de-DE')}
          </p>
        </div>
      </div>
    )
  }

  // Abgelehnt: Hinweis + erneut unterschreiben
  if (dokument.status === 'abgelehnt') {
    // Fallthrough — zeige PDF + SignaturPad unten, aber mit Hinweis
  }

  // Kein PDF hinterlegt
  if (!dokument.vorlage_pdf_url) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Ihre Kanzlei hat dieses Dokument noch nicht bereitgestellt.
          Bitte kontaktieren Sie {kanzleiName} direkt.
        </p>
      </div>
    )
  }

  const handleSignieren = async (signaturDataUrl: string) => {
    if (!dokument.vorlage_pdf_url || isProcessing || upload.isPending) return
    setIsProcessing(true)
    setPdfFehler(null)

    try {
      // URL-Validierung: nur eigene Supabase-Instanz erlauben
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (supabaseUrl && !dokument.vorlage_pdf_url.startsWith(supabaseUrl)) {
        throw new Error('Ungültige Vorlagen-URL')
      }

      // Original-PDF laden
      const pdfResponse = await fetch(dokument.vorlage_pdf_url)
      if (!pdfResponse.ok) {
        throw new Error('PDF konnte nicht geladen werden')
      }
      const pdfBytes = await pdfResponse.arrayBuffer()

      // Groessencheck: max 10MB fuer Browser-Verarbeitung
      if (pdfBytes.byteLength > 10 * 1024 * 1024) {
        throw new Error('PDF ist zu groß für die Verarbeitung (max. 10 MB)')
      }

      // Magic Bytes pruefen: %PDF
      const headerBytes = new Uint8Array(pdfBytes.slice(0, 4))
      if (headerBytes[0] !== 0x25 || headerBytes[1] !== 0x50 || headerBytes[2] !== 0x44 || headerBytes[3] !== 0x46) {
        throw new Error('Ungültige PDF-Datei')
      }

      const pdfDoc = await PDFDocument.load(pdfBytes)

      // Signatur-PNG einbetten
      const signaturPngBytes = await fetch(signaturDataUrl).then((r) => r.arrayBuffer())
      const signaturBild = await pdfDoc.embedPng(signaturPngBytes)

      // Zeitstempel mit Sekunden
      const jetzt = new Date()
      const zeitstempel = jetzt.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

      // Neue Signatur-Seite anhaengen (verhindert Ueberlappung mit Originalinhalt)
      const signaturSeite = pdfDoc.addPage([595.28, 841.89]) // A4
      const seitenBreite = 595.28

      const signaturBreite = 200
      const signaturHoehe = 80

      // Titel
      signaturSeite.drawText('Unterschriftsseite', {
        x: 50,
        y: 780,
        size: 16,
      })

      // Horizontale Linie
      signaturSeite.drawLine({
        start: { x: 50, y: 760 },
        end: { x: seitenBreite - 50, y: 760 },
        thickness: 0.5,
      })

      // Dokument-Referenz
      signaturSeite.drawText(`Dokument: ${dokument.titel}`, {
        x: 50,
        y: 730,
        size: 11,
      })

      signaturSeite.drawText(`Elektronisch unterschrieben am ${zeitstempel} Uhr`, {
        x: 50,
        y: 710,
        size: 11,
      })

      signaturSeite.drawText(`Name: ${mandantName}`, {
        x: 50,
        y: 690,
        size: 11,
      })

      // Signatur-Bild
      signaturSeite.drawImage(signaturBild, {
        x: 50,
        y: 580,
        width: signaturBreite,
        height: signaturHoehe,
      })

      // Linie unter Signatur
      signaturSeite.drawLine({
        start: { x: 50, y: 570 },
        end: { x: 250, y: 570 },
        thickness: 0.5,
      })

      signaturSeite.drawText('Unterschrift', {
        x: 50,
        y: 555,
        size: 9,
      })

      // Signiertes PDF als Blob speichern
      const signierteBytes = await pdfDoc.save()
      const blob = new Blob([signierteBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
      const dateiName = `${dokument.titel.replace(/\s+/g, '_')}_signiert.pdf`
      const datei = new File([blob], dateiName, { type: 'application/pdf' })

      // IP-Adresse fuer Audit-Trail ermitteln
      let signaturIp = 'nicht ermittelbar'
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json')
        if (ipResponse.ok) {
          const ipData: { ip: string } = await ipResponse.json()
          signaturIp = ipData.ip
        }
      } catch {
        // Fallback: IP nicht verfuegbar (z.B. durch AdBlocker)
      }

      // Hochladen
      upload.mutate({
        dokumentId: dokument.id,
        datei,
        portalToken,
        istSigniert: true,
        signaturZeitpunkt: jetzt.toISOString(),
        signaturIp,
      })
    } catch (err) {
      const nachricht = err instanceof Error ? err.message : 'Unbekannter Fehler'
      setPdfFehler(`Dokument konnte nicht verarbeitet werden: ${nachricht}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Abgelehnt-Hinweis */}
      {dokument.status === 'abgelehnt' && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3">
          <AlertTriangle className="h-4 w-4 text-ampel-rot shrink-0" />
          <p className="text-sm text-ampel-rot">
            Ihre Unterschrift wurde abgelehnt. Bitte unterschreiben Sie erneut.
          </p>
        </div>
      )}

      {/* PDF-Vorschau */}
      <div className="space-y-2">
        <object
          data={dokument.vorlage_pdf_url}
          type="application/pdf"
          className="w-full rounded-lg border"
          style={{ height: '400px' }}
        >
          <p className="p-4 text-sm text-muted-foreground">
            PDF kann nicht angezeigt werden.
          </p>
        </object>
        <Button variant="outline" size="sm" className="min-h-[48px] w-full" asChild>
          <a href={dokument.vorlage_pdf_url} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4 mr-2" />
            PDF herunterladen
          </a>
        </Button>
      </div>

      {/* Unterschriftsfeld */}
      <SignaturPad
        onSignieren={handleSignieren}
        isLoading={isProcessing || upload.isPending}
      />

      {/* Fehlermeldungen */}
      {pdfFehler && (
        <p className="text-sm text-destructive">{pdfFehler}</p>
      )}
      {upload.isError && (
        <p className="text-sm text-destructive">
          Unterschrift konnte nicht gespeichert werden. Bitte erneut versuchen.
        </p>
      )}
    </div>
  )
}
