import { useMemo } from 'react'
import { AlertTriangle, Clock, Users, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { MandantenTabelle } from '../components/MandantenTabelle'
import { FreieUploadsAlert } from '../components/FreieUploadsAlert'
import { FristenKalender } from '../components/FristenKalender'
import { useMandantenMitStatus, useFreieUploads } from '../hooks/useDashboard'

export function DashboardPage() {
  const { data: mandanten, isLoading: mandantenLaden } = useMandantenMitStatus()
  const { data: freieUploads } = useFreieUploads()

  // Statistiken berechnen
  const stats = useMemo(() => {
    if (!mandanten) return null

    const alleChecklisten = mandanten.flatMap((m) => m.checklisten)
    const ueberfaellig = alleChecklisten.filter((c) => c.tage_bis_frist < 0 && c.status !== 'vollstaendig').length
    const dieseWoche = alleChecklisten.filter((c) => c.tage_bis_frist >= 0 && c.tage_bis_frist <= 7 && c.status !== 'vollstaendig').length
    const offenGesamt = alleChecklisten.filter((c) => c.status !== 'vollstaendig').length
    const vollstaendig = alleChecklisten.filter((c) => c.status === 'vollstaendig').length

    return { ueberfaellig, dieseWoche, offenGesamt, vollstaendig, mandantenGesamt: mandanten.length }
  }, [mandanten])

  // Alle Checklisten fuer Kalender
  const alleChecklisten = mandanten?.flatMap((m) => m.checklisten) ?? []
  const mandantNamen: Record<string, string> = {}
  mandanten?.forEach((m) => { mandantNamen[m.id] = m.name })

  // Freie Uploads
  const mandantenMitUploads = new Set(freieUploads?.map((u) => u.mandant_id)).size

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Statistik-Karten */}
      {mandantenLaden ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatKarte
            label="Überfällig"
            wert={stats.ueberfaellig}
            icon={<AlertTriangle className="h-5 w-5" />}
            farbe={stats.ueberfaellig > 0 ? 'rot' : 'neutral'}
          />
          <StatKarte
            label="Diese Woche fällig"
            wert={stats.dieseWoche}
            icon={<Clock className="h-5 w-5" />}
            farbe={stats.dieseWoche > 0 ? 'gelb' : 'neutral'}
          />
          <StatKarte
            label="Gesamt offen"
            wert={stats.offenGesamt}
            icon={<Users className="h-5 w-5" />}
            farbe="neutral"
          />
          <StatKarte
            label="Abgeschlossen"
            wert={stats.vollstaendig}
            icon={<CheckCircle className="h-5 w-5" />}
            farbe="gruen"
          />
        </div>
      )}

      {/* Freie Uploads Alert */}
      <FreieUploadsAlert anzahl={mandantenMitUploads} />

      {/* Fristen-Kalender */}
      <FristenKalender checklisten={alleChecklisten} mandantNamen={mandantNamen} />

      {/* Mandanten-Tabelle */}
      {mandantenLaden ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <MandantenTabelle mandanten={mandanten ?? []} />
      )}
    </div>
  )
}

// Statistik-Karte
interface StatKarteProps {
  label: string
  wert: number
  icon: React.ReactNode
  farbe: 'rot' | 'gelb' | 'gruen' | 'neutral'
}

function StatKarte({ label, wert, icon, farbe }: StatKarteProps) {
  const farbKlassen = {
    rot: 'border-ampel-rot/30 bg-ampel-rot/5 text-ampel-rot',
    gelb: 'border-ampel-gelb/30 bg-ampel-gelb/5 text-ampel-gelb',
    gruen: 'border-ampel-gruen/30 bg-ampel-gruen/5 text-ampel-gruen',
    neutral: '',
  }

  return (
    <Card className={farbKlassen[farbe]}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={farbe === 'neutral' ? 'text-muted-foreground' : ''}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{wert}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
