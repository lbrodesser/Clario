import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useDokumentAnleitung } from '../hooks/useDokumentAnleitung'
import type { DokumentAnleitung, MandantTyp } from '@/shared/types'

// Fallback-Texte wenn Claude API nicht erreichbar
const FALLBACK_ANLEITUNGEN: Record<string, DokumentAnleitung> = {
  personalausweis: {
    anleitung: 'Halten Sie Ihren gültigen Personalausweis bereit.',
    schritte: [
      'Fotografieren Sie die Vorderseite bei guter Beleuchtung.',
      'Fotografieren Sie die Rückseite separat.',
      'Achten Sie darauf, dass alle Ecken sichtbar sind.',
    ],
    alternativ: 'Alternativ können Sie auch Ihren Reisepass verwenden.',
  },
  vollmacht: {
    anleitung: 'Das Vollmacht-Formular wird Ihnen von Ihrer Steuerkanzlei bereitgestellt.',
    schritte: [
      'Lesen Sie das Dokument sorgfältig durch.',
      'Unterschreiben Sie digital im Unterschriftsfeld.',
      'Klicken Sie auf "Unterschreiben und absenden".',
    ],
    alternativ: null,
  },
  datenschutz: {
    anleitung: 'Die Datenschutzerklärung wird von Ihrer Steuerkanzlei bereitgestellt.',
    schritte: [
      'Lesen Sie die Datenschutzerklärung durch.',
      'Unterschreiben Sie digital im Unterschriftsfeld.',
      'Klicken Sie auf "Unterschreiben und absenden".',
    ],
    alternativ: null,
  },
  steuerbescheid: {
    anleitung: 'Ihren letzten Steuerbescheid finden Sie in Ihren Unterlagen vom Finanzamt.',
    schritte: [
      'Prüfen Sie Ihren Briefkasten oder Ihre Ablage nach Post vom Finanzamt.',
      'Alternativ: Loggen Sie sich in Ihr ELSTER-Konto ein unter "Bescheide".',
      'Fotografieren oder scannen Sie das Dokument.',
    ],
    alternativ: 'Falls nicht auffindbar, fragen Sie Ihre Kanzlei nach einer Kopie.',
  },
  lohnsteuerbescheinigung: {
    anleitung: 'Ihre Lohnsteuerbescheinigung erhalten Sie von Ihrem Arbeitgeber.',
    schritte: [
      'Die Bescheinigung wird meist im Februar/März für das Vorjahr ausgestellt.',
      'Prüfen Sie Ihre Gehaltsunterlagen oder fragen Sie Ihre Personalabteilung.',
      'Oft finden Sie sie auch in Ihrem Online-Gehaltsportal.',
    ],
    alternativ: null,
  },
}

function findeFallback(dokumentTitel: string): DokumentAnleitung | null {
  const titelLower = dokumentTitel.toLowerCase()
  for (const [schluessel, anleitung] of Object.entries(FALLBACK_ANLEITUNGEN)) {
    if (titelLower.includes(schluessel)) return anleitung
  }
  return null
}

interface WoFindeIchDasProps {
  dokumentTitel: string
  tippBasis: string | null
  mandantTyp: MandantTyp
}

export function WoFindeIchDas({ dokumentTitel, tippBasis, mandantTyp }: WoFindeIchDasProps) {
  const [anleitung, setAnleitung] = useState<DokumentAnleitung | null>(null)
  const [offen, setOffen] = useState(false)
  const mutation = useDokumentAnleitung()

  const handleKlick = () => {
    if (anleitung) {
      setOffen(!offen)
      return
    }

    setOffen(true)
    mutation.mutate(
      {
        dokumentTitel,
        tippBasis: tippBasis ?? '',
        mandantTyp,
      },
      {
        onSuccess: (data) => setAnleitung(data),
        onError: () => {
          // Fallback bei API-Fehler
          const fallback = findeFallback(dokumentTitel)
          if (fallback) setAnleitung(fallback)
        },
      }
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleKlick}
        className="flex items-center gap-1 text-sm text-primary hover:underline min-h-[48px]"
      >
        <HelpCircle className="h-4 w-4" />
        Wo finde ich das?
      </button>

      {offen && (
        <div className="mt-2 rounded-lg bg-muted/50 p-4 text-sm">
          {mutation.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : anleitung ? (
            <div className="space-y-3">
              <p>{anleitung.anleitung}</p>
              <ol className="list-decimal pl-5 space-y-1">
                {anleitung.schritte.map((schritt, i) => (
                  <li key={i}>{schritt}</li>
                ))}
              </ol>
              {anleitung.alternativ && (
                <p className="text-muted-foreground italic">
                  Alternativ: {anleitung.alternativ}
                </p>
              )}
            </div>
          ) : mutation.isError ? (
            <p className="text-destructive">Anleitung konnte nicht geladen werden.</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
