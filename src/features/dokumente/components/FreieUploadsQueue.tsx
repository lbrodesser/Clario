import { Download } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatDatum, formatDateigroesse } from '@/shared/lib/utils'
import { useFreieUploadsListe } from '../hooks/useDokumente'

export function FreieUploadsQueue() {
  const { data: uploads, isLoading } = useFreieUploadsListe()

  if (isLoading) return <Skeleton className="h-64" />

  return (
    <div className="space-y-2">
      {uploads?.map((upload) => (
        <div key={upload.id} className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">{upload.dateiname}</p>
            {upload.beschreibung && (
              <p className="text-sm text-muted-foreground">{upload.beschreibung}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDatum(upload.hochgeladen_am)}
              {upload.dateigroesse_kb && ` (${formatDateigroesse(upload.dateigroesse_kb)})`}
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <a href={upload.datei_url} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      ))}
      {uploads?.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          Keine freien Uploads vorhanden.
        </p>
      )}
    </div>
  )
}
