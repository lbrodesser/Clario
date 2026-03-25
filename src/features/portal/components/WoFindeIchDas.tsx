import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useDokumentAnleitung } from '../hooks/useDokumentAnleitung'
import type { DokumentAnleitung, MandantTyp } from '@/shared/types'

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
