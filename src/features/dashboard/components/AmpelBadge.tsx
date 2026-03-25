import { cn } from '@/shared/lib/utils'
import type { AmpelFarbe } from '@/shared/types'

interface AmpelBadgeProps {
  farbe: AmpelFarbe
}

export function AmpelBadge({ farbe }: AmpelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block h-3 w-3 rounded-full',
        farbe === 'gruen' && 'bg-ampel-gruen',
        farbe === 'gelb' && 'bg-ampel-gelb',
        farbe === 'rot' && 'bg-ampel-rot'
      )}
      title={farbe === 'gruen' ? 'Alles eingereicht' : farbe === 'gelb' ? 'Ausstehend' : 'Kritisch / Ueberfaellig'}
    />
  )
}
