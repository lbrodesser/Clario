import { AlertTriangle, Check, Clock, Download, X } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { formatDatum, formatDateigroesse } from '@/shared/lib/utils'
import type { DokumentMitDateien } from '@/shared/types'

interface DokumentZeileProps {
  dokument: DokumentMitDateien
}

export function DokumentZeile({ dokument }: DokumentZeileProps) {
  const statusIcon = {
    ausstehend: <Clock className="h-4 w-4 text-muted-foreground" />,
    hochgeladen: <Check className="h-4 w-4 text-ampel-gruen" />,
    geprueft: <Check className="h-4 w-4 text-green-800" />,
    abgelehnt: <X className="h-4 w-4 text-ampel-rot" />,
  }

  const hatQualitaetsWarnung = dokument.dateien.some(
    (d) => d.qualitaet_trotzdem_hochgeladen
  )

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        {statusIcon[dokument.status]}
        <div>
          <p className="text-sm font-medium">{dokument.titel}</p>
          {dokument.dateien.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Hochgeladen am {formatDatum(dokument.dateien[0].hochgeladen_am)}
              {dokument.dateien[0].dateigroesse_kb && (
                <> ({formatDateigroesse(dokument.dateien[0].dateigroesse_kb)})</>
              )}
            </p>
          )}
          {hatQualitaetsWarnung && (
            <div className="mt-1 flex items-center gap-1 text-xs text-ampel-gelb">
              <AlertTriangle className="h-3 w-3" />
              Bildqualitaet pruefen
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!dokument.pflicht && <Badge variant="outline">Optional</Badge>}
        {dokument.dateien.length > 0 && (
          <Button variant="ghost" size="sm" asChild>
            <a href={dokument.dateien[0].datei_url} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
