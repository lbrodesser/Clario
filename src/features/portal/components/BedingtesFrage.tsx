import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import type { FormularFrage } from '@/shared/types'

interface BedingtesFrageProps {
  fragen: FormularFrage[]
}

export function BedingtesFrage({ fragen }: BedingtesFrageProps) {
  const [aktuellerIndex, setAktuellerIndex] = useState(0)
  const [_antworten, setAntworten] = useState<Record<string, string>>({})

  const sichtbareFragen = fragen.filter((f) => {
    if (!f.bedingt_durch_frage_id) return true
    // Pruefen ob die bedingung erfuellt ist
    return _antworten[f.bedingt_durch_frage_id] === f.bedingt_bei_antwort
  })

  const aktuelleFrage = sichtbareFragen[aktuellerIndex]
  if (!aktuelleFrage) return null

  const fortschritt = Math.round(((aktuellerIndex + 1) / sichtbareFragen.length) * 100)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Schritt {aktuellerIndex + 1} von {sichtbareFragen.length}</span>
      </div>
      <Progress value={fortschritt} className="h-2" />

      <p className="text-[16px] font-medium">{aktuelleFrage.frage_text}</p>

      {aktuelleFrage.eingabe_typ === 'auswahl' && aktuelleFrage.auswahl_optionen && (
        <div className="grid gap-2">
          {(aktuelleFrage.auswahl_optionen as string[]).map((option) => (
            <Button
              key={option}
              variant="outline"
              className="min-h-[48px] justify-start text-[16px]"
              onClick={() => {
                setAntworten((prev) => ({ ...prev, [aktuelleFrage.id]: option }))
                if (aktuellerIndex < sichtbareFragen.length - 1) {
                  setAktuellerIndex(aktuellerIndex + 1)
                }
              }}
            >
              {option}
            </Button>
          ))}
        </div>
      )}

      {aktuellerIndex > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAktuellerIndex(aktuellerIndex - 1)}
          className="gap-1 min-h-[48px]"
        >
          <ChevronLeft className="h-4 w-4" />
          Zurueck
        </Button>
      )}
    </div>
  )
}
