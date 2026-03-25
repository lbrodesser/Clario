import { Badge } from '@/shared/components/ui/badge'
import { mandantTypLabel } from '@/shared/lib/utils'
import type { MandantTyp } from '@/shared/types'

interface MandantTypBadgeProps {
  typ: MandantTyp
}

export function MandantTypBadge({ typ }: MandantTypBadgeProps) {
  return <Badge variant="secondary">{mandantTypLabel(typ)}</Badge>
}
