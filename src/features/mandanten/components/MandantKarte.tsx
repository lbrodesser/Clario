import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { MandantTypBadge } from './MandantTypBadge'
import type { Mandant } from '@/shared/types'

interface MandantKarteProps {
  mandant: Mandant
}

export function MandantKarte({ mandant }: MandantKarteProps) {
  return (
    <Link to={`/app/mandanten/${mandant.id}`}>
      <Card className="hover:bg-muted/30 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{mandant.name}</CardTitle>
            <MandantTypBadge typ={mandant.typ} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{mandant.email}</p>
          {!mandant.gwg_identifiziert && (
            <p className="mt-2 text-xs text-ampel-rot font-medium">GwG nicht erfuellt</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
