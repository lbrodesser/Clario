import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Button } from '@/shared/components/ui/button'
import { KanzleiProfilForm } from '../components/KanzleiProfilForm'
import { ErinnerungsKonfiguration } from '../components/ErinnerungsKonfiguration'
import { StripeAbonnement } from '../components/StripeAbonnement'
import { useKanzlei } from '@/features/dashboard/hooks/useDashboard'

export function EinstellungenPage() {
  const { data: kanzlei, isLoading } = useKanzlei()

  if (isLoading || !kanzlei) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Einstellungen</h1>

      <Card>
        <CardHeader>
          <CardTitle>Kanzleiprofil</CardTitle>
        </CardHeader>
        <CardContent>
          <KanzleiProfilForm kanzlei={kanzlei} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Erinnerungen &amp; Ampel</CardTitle>
        </CardHeader>
        <CardContent>
          <ErinnerungsKonfiguration kanzlei={kanzlei} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Abonnement</CardTitle>
        </CardHeader>
        <CardContent>
          <StripeAbonnement kanzlei={kanzlei} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>DSGVO</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Löschen Sie alle Daten eines Mandanten unwiderruflich.
          </p>
          <Button variant="destructive">
            Mandantendaten löschen
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
