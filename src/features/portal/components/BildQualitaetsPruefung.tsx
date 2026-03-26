import { Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import type { QualitaetsPruefung } from '@/shared/types'

interface BildQualitaetsPruefungProps {
  dateiVorschau: string
  pruefung: QualitaetsPruefung | null
  isLoading: boolean
  onHochladen: (trotzdem: boolean) => void
  onNochmal: () => void
}

export function BildQualitaetsPruefung({
  dateiVorschau,
  pruefung,
  isLoading,
  onHochladen,
  onNochmal,
}: BildQualitaetsPruefungProps) {
  return (
    <div className="space-y-3">
      <div className="relative rounded-lg overflow-hidden">
        <img src={dateiVorschau} alt="Vorschau" className="w-full max-h-48 object-contain bg-muted" />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="space-y-2 text-center">
              <Skeleton className="mx-auto h-6 w-6 rounded-full" />
              <p className="text-sm">Qualität wird geprüft...</p>
            </div>
          </div>
        )}
        {pruefung?.bestanden && (
          <div className="absolute top-2 right-2 rounded-full bg-ampel-gruen p-1">
            <Check className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {pruefung && !pruefung.bestanden && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-sm text-orange-800">{pruefung.hinweis}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={onNochmal} className="min-h-[48px]">
              Nochmal aufnehmen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onHochladen(true)}
              className="text-xs min-h-[48px]"
            >
              Trotzdem hochladen
            </Button>
          </div>
        </div>
      )}

      {pruefung?.bestanden && (
        <Button onClick={() => onHochladen(false)} className="w-full min-h-[48px]">
          Hochladen
        </Button>
      )}
    </div>
  )
}
