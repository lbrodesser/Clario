import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Progress } from '@/shared/components/ui/progress'
import { useFormularFragen, useFormularAntworten, useAntwortSpeichern } from '../hooks/useFormularAntworten'
import { Skeleton } from '@/shared/components/ui/skeleton'

interface BedingtesFrageProps {
  dokumentId: string
  checklisteId: string
  portalToken: string
  onAbgeschlossen?: () => void
}

export function BedingtesFrage({ dokumentId, checklisteId, portalToken, onAbgeschlossen }: BedingtesFrageProps) {
  const { data: fragen, isLoading: fragenLaden } = useFormularFragen(dokumentId)
  const { data: gespeicherteAntworten } = useFormularAntworten(checklisteId, dokumentId)
  const antwortSpeichern = useAntwortSpeichern()

  const [aktuellerIndex, setAktuellerIndex] = useState(0)
  const [antworten, setAntworten] = useState<Record<string, string>>({})
  const [abgeschlossen, setAbgeschlossen] = useState(false)

  // Gespeicherte Antworten in lokalen State laden
  useEffect(() => {
    if (!gespeicherteAntworten) return
    const map: Record<string, string> = {}
    for (const a of gespeicherteAntworten) {
      if (a.antwort_text) map[a.frage_id] = a.antwort_text
      else if (a.antwort_zahl !== null) map[a.frage_id] = String(a.antwort_zahl)
    }
    setAntworten((prev) => ({ ...map, ...prev }))
  }, [gespeicherteAntworten])

  if (fragenLaden) return <Skeleton className="h-32 w-full" />
  if (!fragen || fragen.length === 0) return null

  // Sichtbare Fragen basierend auf Bedingungen filtern
  const sichtbareFragen = fragen.filter((f) => {
    if (!f.bedingt_durch_frage_id) return true
    return antworten[f.bedingt_durch_frage_id] === f.bedingt_bei_antwort
  })

  const aktuelleFrage = sichtbareFragen[aktuellerIndex]
  if (!aktuelleFrage && !abgeschlossen) return null

  const fortschritt = Math.round(((aktuellerIndex + 1) / sichtbareFragen.length) * 100)
  const istLetzteFrage = aktuellerIndex >= sichtbareFragen.length - 1
  const aktuelleAntwort = aktuelleFrage ? antworten[aktuelleFrage.id] ?? '' : ''

  const speichereAntwort = (frageId: string, wert: string, istZahl: boolean) => {
    setAntworten((prev) => ({ ...prev, [frageId]: wert }))
    antwortSpeichern.mutate({
      frageId,
      checklisteId,
      portalToken,
      dokumentId,
      antwortText: istZahl ? undefined : wert,
      antwortZahl: istZahl ? Number(wert) : undefined,
    })
  }

  const handleWeiter = () => {
    if (istLetzteFrage) {
      setAbgeschlossen(true)
      onAbgeschlossen?.()
    } else {
      setAktuellerIndex(aktuellerIndex + 1)
    }
  }

  if (abgeschlossen) {
    return (
      <div className="rounded-lg border border-ampel-gruen/30 bg-ampel-gruen/5 p-4 text-center space-y-2">
        <Check className="h-8 w-8 text-ampel-gruen mx-auto" />
        <p className="font-medium">Fragebogen abgeschlossen</p>
        <p className="text-sm text-muted-foreground">
          {sichtbareFragen.length} Fragen beantwortet
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Schritt {aktuellerIndex + 1} von {sichtbareFragen.length}</span>
      </div>
      <Progress value={fortschritt} className="h-2" />

      <p className="text-[16px] font-medium">{aktuelleFrage.frage_text}</p>

      {/* Auswahl */}
      {aktuelleFrage.eingabe_typ === 'auswahl' && aktuelleFrage.auswahl_optionen && (
        <div className="grid gap-2">
          {(aktuelleFrage.auswahl_optionen as string[]).map((option) => (
            <Button
              key={option}
              variant={aktuelleAntwort === option ? 'default' : 'outline'}
              className="min-h-[48px] justify-start text-[16px]"
              onClick={() => {
                speichereAntwort(aktuelleFrage.id, option, false)
                // Bei Auswahl automatisch weiter
                if (!istLetzteFrage) {
                  setTimeout(() => setAktuellerIndex(aktuellerIndex + 1), 200)
                }
              }}
            >
              {option}
            </Button>
          ))}
        </div>
      )}

      {/* Zahl-Eingabe */}
      {aktuelleFrage.eingabe_typ === 'zahl_eingabe' && (
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            className="min-h-[48px] text-[16px]"
            value={aktuelleAntwort}
            onChange={(e) => setAntworten((prev) => ({ ...prev, [aktuelleFrage.id]: e.target.value }))}
            onBlur={() => {
              if (aktuelleAntwort) speichereAntwort(aktuelleFrage.id, aktuelleAntwort, true)
            }}
            placeholder="Zahl eingeben"
          />
          {aktuelleFrage.einheit && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">{aktuelleFrage.einheit}</span>
          )}
        </div>
      )}

      {/* Text-Eingabe */}
      {aktuelleFrage.eingabe_typ === 'text_eingabe' && (
        <Input
          type="text"
          className="min-h-[48px] text-[16px]"
          value={aktuelleAntwort}
          onChange={(e) => setAntworten((prev) => ({ ...prev, [aktuelleFrage.id]: e.target.value }))}
          onBlur={() => {
            if (aktuelleAntwort) speichereAntwort(aktuelleFrage.id, aktuelleAntwort, false)
          }}
          placeholder="Antwort eingeben"
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        {aktuellerIndex > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAktuellerIndex(aktuellerIndex - 1)}
            className="gap-1 min-h-[48px]"
          >
            <ChevronLeft className="h-4 w-4" />
            Zurueck
          </Button>
        ) : (
          <div />
        )}

        {/* Weiter/Abschliessen nur bei Nicht-Auswahl oder wenn Antwort vorhanden */}
        {(aktuelleFrage.eingabe_typ !== 'auswahl' || aktuelleAntwort) && (
          <Button
            size="sm"
            onClick={handleWeiter}
            disabled={!aktuelleAntwort}
            className="gap-1 min-h-[48px]"
          >
            {istLetzteFrage ? 'Abschliessen' : 'Weiter'}
            {istLetzteFrage ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  )
}
