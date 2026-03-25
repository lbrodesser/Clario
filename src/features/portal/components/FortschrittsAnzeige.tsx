import { Progress } from '@/shared/components/ui/progress'

interface FortschrittsAnzeigeProps {
  fertig: number
  gesamt: number
  prozent: number
}

export function FortschrittsAnzeige({ fertig, gesamt, prozent }: FortschrittsAnzeigeProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {fertig} von {gesamt} Pflichtdokumenten eingereicht
      </p>
      <Progress value={prozent} className="h-3" />
    </div>
  )
}
