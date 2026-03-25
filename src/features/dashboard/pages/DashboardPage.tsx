import { Skeleton } from '@/shared/components/ui/skeleton'
import { MandantenTabelle } from '../components/MandantenTabelle'
import { FreieUploadsAlert } from '../components/FreieUploadsAlert'
import { FristenKalender } from '../components/FristenKalender'
import { useMandantenMitStatus, useFreieUploads } from '../hooks/useDashboard'

export function DashboardPage() {
  const { data: mandanten, isLoading: mandantenLaden } = useMandantenMitStatus()
  const { data: freieUploads } = useFreieUploads()

  // Alle Checklisten fuer FristenKalender sammeln
  const alleChecklisten = mandanten?.flatMap((m) => m.checklisten) ?? []
  const mandantNamen: Record<string, string> = {}
  mandanten?.forEach((m) => { mandantNamen[m.id] = m.name })

  // Anzahl Mandanten mit freien Uploads
  const mandantenMitUploads = new Set(freieUploads?.map((u) => u.mandant_id)).size

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <FreieUploadsAlert anzahl={mandantenMitUploads} />

      <FristenKalender checklisten={alleChecklisten} mandantNamen={mandantNamen} />

      {mandantenLaden ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <MandantenTabelle mandanten={mandanten ?? []} />
      )}
    </div>
  )
}
