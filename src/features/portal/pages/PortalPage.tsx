import { useParams } from 'react-router-dom'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Separator } from '@/shared/components/ui/separator'
import { ChecklisteAnsicht } from '../components/ChecklisteAnsicht'
import { PortalErrorBoundary } from '../components/PortalErrorBoundary'
import { FortschrittsAnzeige } from '../components/FortschrittsAnzeige'
import { FreierUploadButton } from '../components/FreierUploadButton'
import { usePortalDaten } from '../hooks/usePortal'
import { formatDatum } from '@/shared/lib/utils'

export function PortalPage() {
  const { token } = useParams<{ token: string }>()
  const { data, isLoading, isError } = usePortalDaten(token ?? '')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Link ungültig oder abgelaufen</p>
          <p className="text-sm text-muted-foreground mt-2">
            Bitte wenden Sie sich an Ihre Steuerkanzlei für einen neuen Link.
          </p>
        </div>
      </div>
    )
  }

  const { kanzlei, mandant, checkliste } = data
  const pflichtDoks = checkliste.dokumente.filter((d) => d.pflicht)
  const fertig = pflichtDoks.filter(
    (d) => d.status === 'hochgeladen' || d.status === 'geprueft'
  ).length
  const alleVollstaendig = fertig === pflichtDoks.length && pflichtDoks.length > 0

  return (
    <div className="space-y-6">
      {/* Kanzlei-Header */}
      <div className="text-center">
        {kanzlei.logo_url ? (
          <img src={kanzlei.logo_url} alt={kanzlei.name} className="mx-auto mb-3 h-12" />
        ) : (
          <p className="mb-3 text-lg font-semibold">{kanzlei.name}</p>
        )}
        <h1 className="text-xl font-bold">{checkliste.titel}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bitte bis {formatDatum(checkliste.frist)} einreichen
        </p>
      </div>

      {/* Fortschritt */}
      <FortschrittsAnzeige
        fertig={fertig}
        gesamt={pflichtDoks.length}
        prozent={checkliste.fortschritt}
      />

      <Separator />

      {/* Vollstaendig-Meldung */}
      {alleVollstaendig && (
        <div className="rounded-lg bg-ampel-gruen/10 p-6 text-center">
          <p className="text-lg font-medium text-ampel-gruen">
            Alle Pflichtunterlagen eingereicht.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {kanzlei.name} wurde benachrichtigt.
          </p>
        </div>
      )}

      {/* Dokumentenliste */}
      <PortalErrorBoundary>
        <ChecklisteAnsicht
          checkliste={checkliste}
          portalToken={token ?? ''}
          mandantTyp={mandant.typ}
          mandantName={mandant.name}
          kanzleiName={kanzlei.name}
        />
      </PortalErrorBoundary>

      {/* Freier Upload */}
      {checkliste.freie_uploads_erlaubt && (
        <>
          <Separator />
          <FreierUploadButton
            mandantId={mandant.id}
            checklisteId={checkliste.id}
            portalToken={token ?? ''}
          />
        </>
      )}
    </div>
  )
}
