import { Button } from '@/shared/components/ui/button'
import { useWertSpeichern } from '../hooks/useUpload'

interface AuswahlEingabeProps {
  dokumentId: string
  portalToken: string
  optionen: string[]
  aktuellerWert?: string | null
}

export function AuswahlEingabe({ dokumentId, portalToken, optionen, aktuellerWert }: AuswahlEingabeProps) {
  const speichern = useWertSpeichern()

  const handleAuswahl = (option: string) => {
    speichern.mutate({ dokumentId, portalToken, text: option })
  }

  return (
    <div className="grid gap-2">
      {optionen.map((option) => (
        <Button
          key={option}
          variant={aktuellerWert === option ? 'default' : 'outline'}
          className="min-h-[48px] justify-start text-left text-[16px]"
          onClick={() => handleAuswahl(option)}
          disabled={speichern.isPending}
        >
          {option}
        </Button>
      ))}
    </div>
  )
}
