import { Check, Download } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { formatDatum, formatDateigroesse } from '@/shared/lib/utils'
import { useDokumenteEingang, useDokumentAlsGeprueft } from '../hooks/useDokumente'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function DokumentenEingang() {
  const { data: dokumente, isLoading } = useDokumenteEingang()
  const alsPrueft = useDokumentAlsGeprueft()

  if (isLoading) return <Skeleton className="h-64" />

  return (
    <div className="space-y-2">
      {dokumente?.map((dok) => (
        <div key={dok.id} className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">{dok.titel}</p>
            {dok.dateien[0] && (
              <p className="text-sm text-muted-foreground">
                {dok.dateien[0].dateiname} ({formatDateigroesse(dok.dateien[0].dateigroesse_kb ?? 0)})
                {' — '}{formatDatum(dok.dateien[0].hochgeladen_am)}
              </p>
            )}
            {dok.dateien.some((d) => d.qualitaet_trotzdem_hochgeladen) && (
              <Badge variant="outline" className="mt-1 text-ampel-gelb border-ampel-gelb">
                Qualitaet pruefen
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {dok.dateien[0] && (
              <Button variant="ghost" size="sm" asChild>
                <a href={dok.dateien[0].datei_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => alsPrueft.mutate(dok.id)}
              disabled={alsPrueft.isPending}
            >
              <Check className="h-4 w-4" />
              Geprueft
            </Button>
          </div>
        </div>
      ))}
      {dokumente?.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          Keine neuen Dokumente im Eingang.
        </p>
      )}
    </div>
  )
}
