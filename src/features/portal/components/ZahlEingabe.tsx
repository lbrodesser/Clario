import { useState } from 'react'
import { Input } from '@/shared/components/ui/input'
import { useWertSpeichern } from '../hooks/useUpload'

interface ZahlEingabeProps {
  dokumentId: string
  portalToken: string
  einheit: string | null
  min?: number | null
  max?: number | null
  aktuellerWert?: number | null
}

export function ZahlEingabe({ dokumentId, portalToken, einheit, min, max, aktuellerWert }: ZahlEingabeProps) {
  const [wert, setWert] = useState(aktuellerWert?.toString() ?? '')
  const speichern = useWertSpeichern()

  const handleBlur = () => {
    const zahl = parseFloat(wert)
    if (isNaN(zahl)) return
    speichern.mutate({ dokumentId, portalToken, zahl })
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={wert}
        onChange={(e) => setWert(e.target.value)}
        onBlur={handleBlur}
        min={min ?? undefined}
        max={max ?? undefined}
        className="text-lg h-12 text-[16px]"
        placeholder="0"
      />
      {einheit && (
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          {einheit}
        </span>
      )}
    </div>
  )
}
