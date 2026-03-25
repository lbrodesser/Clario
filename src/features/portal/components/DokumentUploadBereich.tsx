import { useState } from 'react'
import { FotoCapture } from './FotoCapture'
import { BildQualitaetsPruefung } from './BildQualitaetsPruefung'
import { ZahlEingabe } from './ZahlEingabe'
import { TextEingabe } from './TextEingabe'
import { AuswahlEingabe } from './AuswahlEingabe'
import { useBildQualitaet, dateiZuBase64 } from '../hooks/useBildQualitaet'
import { useUpload } from '../hooks/useUpload'
import type { DokumentMitDateien, QualitaetsPruefung, MandantTyp } from '@/shared/types'
import { WoFindeIchDas } from './WoFindeIchDas'

interface DokumentUploadBereichProps {
  dokument: DokumentMitDateien
  portalToken: string
  mandantTyp: MandantTyp
}

export function DokumentUploadBereich({ dokument, portalToken, mandantTyp }: DokumentUploadBereichProps) {
  const [gewaehlteDatei, setGewaehlteDatei] = useState<File | null>(null)
  const [vorschauUrl, setVorschauUrl] = useState<string | null>(null)
  const [pruefung, setPruefung] = useState<QualitaetsPruefung | null>(null)
  const bildQualitaet = useBildQualitaet()
  const upload = useUpload()

  const handleDateiGewaehlt = async (datei: File) => {
    setGewaehlteDatei(datei)
    setPruefung(null)

    // Vorschau erzeugen
    if (datei.type.startsWith('image/')) {
      const url = URL.createObjectURL(datei)
      setVorschauUrl(url)

      // Qualitaetspruefung starten
      const base64 = await dateiZuBase64(datei)
      bildQualitaet.mutate(
        { bildBase64: base64, dokumentTitel: dokument.titel },
        { onSuccess: (result) => setPruefung(result) }
      )
    } else {
      // PDFs direkt hochladen
      setVorschauUrl(null)
      upload.mutate({
        dokumentId: dokument.id,
        datei,
        portalToken,
      })
    }
  }

  const handleHochladen = (trotzdem: boolean) => {
    if (!gewaehlteDatei) return
    upload.mutate({
      dokumentId: dokument.id,
      datei: gewaehlteDatei,
      portalToken,
      qualitaetBestanden: pruefung?.bestanden,
      qualitaetHinweis: pruefung?.hinweis ?? undefined,
      qualitaetTrotzdem: trotzdem,
    })
  }

  const handleNochmal = () => {
    setGewaehlteDatei(null)
    setVorschauUrl(null)
    setPruefung(null)
  }

  // Status-Anzeige
  if (dokument.status === 'hochgeladen' || dokument.status === 'geprueft') {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Wo finde ich das? */}
      {dokument.tipp_basis && (
        <WoFindeIchDas
          dokumentTitel={dokument.titel}
          tippBasis={dokument.tipp_basis}
          mandantTyp={mandantTyp}
        />
      )}

      {/* Je nach Eingabetyp */}
      {dokument.eingabe_typ === 'datei_upload' && !gewaehlteDatei && (
        <FotoCapture
          onDateiGewaehlt={handleDateiGewaehlt}
          xmlErlaubt={dokument.xml_erlaubt}
        />
      )}

      {dokument.eingabe_typ === 'datei_upload' && vorschauUrl && gewaehlteDatei && (
        <BildQualitaetsPruefung
          dateiVorschau={vorschauUrl}
          pruefung={pruefung}
          isLoading={bildQualitaet.isPending}
          onHochladen={handleHochladen}
          onNochmal={handleNochmal}
        />
      )}

      {dokument.eingabe_typ === 'zahl_eingabe' && (
        <ZahlEingabe
          dokumentId={dokument.id}
          portalToken={portalToken}
          einheit={dokument.einheit}
          min={dokument.zahl_min}
          max={dokument.zahl_max}
          aktuellerWert={dokument.eingabe_wert_zahl}
        />
      )}

      {dokument.eingabe_typ === 'text_eingabe' && (
        <TextEingabe
          dokumentId={dokument.id}
          portalToken={portalToken}
          format={dokument.text_format}
          placeholder={dokument.text_placeholder}
          aktuellerWert={dokument.eingabe_wert_text}
        />
      )}

      {dokument.eingabe_typ === 'auswahl' && dokument.auswahl_optionen && (
        <AuswahlEingabe
          dokumentId={dokument.id}
          portalToken={portalToken}
          optionen={dokument.auswahl_optionen}
          aktuellerWert={dokument.eingabe_wert_text}
        />
      )}

      {dokument.eingabe_typ === 'kombination' && (
        <div className="space-y-3">
          {dokument.kombination_typen?.includes('zahl_eingabe') && (
            <ZahlEingabe
              dokumentId={dokument.id}
              portalToken={portalToken}
              einheit={dokument.einheit}
              aktuellerWert={dokument.eingabe_wert_zahl}
            />
          )}
          {dokument.kombination_typen?.includes('datei_upload') && !gewaehlteDatei && (
            <FotoCapture onDateiGewaehlt={handleDateiGewaehlt} />
          )}
          {dokument.kombination_typen?.includes('text_eingabe') && (
            <TextEingabe
              dokumentId={dokument.id}
              portalToken={portalToken}
              format={dokument.text_format}
              placeholder={dokument.text_placeholder}
              aktuellerWert={dokument.eingabe_wert_text}
            />
          )}
        </div>
      )}

      {upload.isPending && (
        <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>
      )}
      {upload.isError && (
        <p className="text-sm text-destructive">Upload fehlgeschlagen. Bitte erneut versuchen.</p>
      )}
    </div>
  )
}
