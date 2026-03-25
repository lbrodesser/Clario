import { useParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { MandantTypBadge } from '../components/MandantTypBadge'
import { GwGOnboarding } from '../components/GwGOnboarding'
import { ChecklisteEditor } from '@/features/checklisten/components/ChecklisteEditor'
import { useMandant, useMitarbeiter } from '../hooks/useMandanten'
import { useChecklisten } from '@/features/checklisten/hooks/useChecklisten'
import { mandantTypLabel } from '@/shared/lib/utils'

export function MandantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: mandant, isLoading } = useMandant(id ?? '')
  const { data: checklisten } = useChecklisten(id ?? '')
  const { data: mitarbeiter } = useMitarbeiter(id ?? '')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!mandant) {
    return <p className="text-muted-foreground">Mandant nicht gefunden.</p>
  }

  const zeigtMitarbeiter = ['gmbh_ug', 'kleingewerbe', 'personengesellschaft'].includes(mandant.typ)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">{mandant.name}</h1>
        <MandantTypBadge typ={mandant.typ} />
      </div>

      <GwGOnboarding mandant={mandant} />

      <Tabs defaultValue="uebersicht">
        <TabsList>
          <TabsTrigger value="uebersicht">Uebersicht</TabsTrigger>
          <TabsTrigger value="checklisten">Checklisten</TabsTrigger>
          {zeigtMitarbeiter && (
            <TabsTrigger value="mitarbeiter">Mitarbeiter</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="uebersicht">
          <Card>
            <CardHeader>
              <CardTitle>Stammdaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">E-Mail</p>
                  <p>{mandant.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Typ</p>
                  <p>{mandantTypLabel(mandant.typ)}</p>
                </div>
                {mandant.steuer_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">Steuer-ID</p>
                    <p>{mandant.steuer_id}</p>
                  </div>
                )}
                {mandant.ist_heilberuf && (
                  <div>
                    <Badge variant="secondary">Heilberuf</Badge>
                  </div>
                )}
              </div>
              {mandant.notizen && (
                <div>
                  <p className="text-sm text-muted-foreground">Notizen</p>
                  <p className="whitespace-pre-wrap">{mandant.notizen}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklisten">
          <ChecklisteEditor mandantId={mandant.id} mandantTyp={mandant.typ} checklisten={checklisten ?? []} />
        </TabsContent>

        {zeigtMitarbeiter && (
          <TabsContent value="mitarbeiter">
            <Card>
              <CardHeader>
                <CardTitle>Mitarbeiter</CardTitle>
              </CardHeader>
              <CardContent>
                {mitarbeiter && mitarbeiter.length > 0 ? (
                  <div className="space-y-2">
                    {mitarbeiter.map((ma) => (
                      <div key={ma.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{ma.vorname} {ma.nachname}</p>
                          <p className="text-sm text-muted-foreground">{ma.beschaeftigungsart}</p>
                        </div>
                        <Badge variant={ma.aktiv ? 'default' : 'secondary'}>
                          {ma.aktiv ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Keine Mitarbeiter hinterlegt.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
