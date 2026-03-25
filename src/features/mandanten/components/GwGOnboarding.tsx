import { AlertTriangle, Check } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { useMandantAktualisieren } from '../hooks/useMandanten'
import type { Mandant } from '@/shared/types'

interface GwGOnboardingProps {
  mandant: Mandant
}

export function GwGOnboarding({ mandant }: GwGOnboardingProps) {
  const aktualisieren = useMandantAktualisieren()

  if (mandant.gwg_identifiziert) {
    return (
      <Card className="border-ampel-gruen">
        <CardContent className="flex items-center gap-3 p-4">
          <Check className="h-5 w-5 text-ampel-gruen" />
          <span className="text-sm">
            GwG-Identifizierung abgeschlossen
            {mandant.gwg_identifiziert_am && ` am ${new Date(mandant.gwg_identifiziert_am).toLocaleDateString('de-DE')}`}
          </span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-ampel-rot">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-ampel-rot" />
          <div>
            <p className="text-sm font-medium">GwG-Identifizierung ausstehend</p>
            <p className="text-xs text-muted-foreground">Pflicht bei Mandatsaufnahme (Geldwaeschegesetz)</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => aktualisieren.mutate({
            id: mandant.id,
            gwg_identifiziert: true,
            gwg_identifiziert_am: new Date().toISOString(),
          })}
          disabled={aktualisieren.isPending}
        >
          Als identifiziert markieren
        </Button>
      </CardContent>
    </Card>
  )
}
