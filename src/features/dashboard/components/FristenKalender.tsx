import { Send } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { formatDatum } from '@/shared/lib/utils'
import type { ChecklisteMitDokumente } from '@/shared/types'

interface FristenKalenderProps {
  checklisten: ChecklisteMitDokumente[]
  mandantNamen: Record<string, string>
}

export function FristenKalender({ checklisten, mandantNamen }: FristenKalenderProps) {
  const heuteFaellig = checklisten.filter((c) => c.tage_bis_frist === 0)

  if (heuteFaellig.length === 0) return null

  return (
    <Card className="border-ampel-rot">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Heute faellig</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {heuteFaellig.map((cl) => (
          <div key={cl.id} className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{mandantNamen[cl.mandant_id] ?? 'Unbekannt'}</span>
              <span className="text-muted-foreground"> — {cl.titel}</span>
              <span className="text-muted-foreground"> (Frist: {formatDatum(cl.frist)})</span>
            </div>
            <Button variant="outline" size="sm" className="gap-1">
              <Send className="h-3 w-3" />
              Erinnern
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
