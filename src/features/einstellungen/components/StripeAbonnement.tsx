import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { formatDatum } from '@/shared/lib/utils'
import type { Kanzlei } from '@/shared/types'

interface StripeAbonnementProps {
  kanzlei: Kanzlei
}

export function StripeAbonnement({ kanzlei }: StripeAbonnementProps) {
  const planLabels = {
    trial: 'Testversion',
    starter: 'Starter',
    pro: 'Professional',
    kanzlei: 'Kanzlei',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm">Aktueller Plan:</span>
        <Badge>{planLabels[kanzlei.plan]}</Badge>
      </div>
      {kanzlei.plan === 'trial' && (
        <p className="text-sm text-muted-foreground">
          Testversion laeuft ab am {formatDatum(kanzlei.trial_ends_at)}
        </p>
      )}
      <Button variant="outline">
        Abo verwalten
      </Button>
    </div>
  )
}
