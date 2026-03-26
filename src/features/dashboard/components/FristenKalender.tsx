import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import { useErinnerungSenden } from '@/features/checklisten/hooks/useChecklisten'
import { toast } from '@/shared/hooks/useToast'
import type { ChecklisteMitDokumente } from '@/shared/types'

interface FristenKalenderProps {
  checklisten: ChecklisteMitDokumente[]
  mandantNamen: Record<string, string>
}

type Ansicht = 'woche' | 'monat'

// Hilfsfunktionen
function datumKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

function wochenTage(startDatum: Date): Date[] {
  const montag = new Date(startDatum)
  const tag = montag.getDay()
  const diff = tag === 0 ? -6 : 1 - tag
  montag.setDate(montag.getDate() + diff)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(montag)
    d.setDate(montag.getDate() + i)
    return d
  })
}

function monatsTage(jahr: number, monat: number): Date[][] {
  const ersterTag = new Date(jahr, monat, 1)
  const letzterTag = new Date(jahr, monat + 1, 0)

  // Montag als Wochenstart
  const startTag = new Date(ersterTag)
  const diff = startTag.getDay() === 0 ? -6 : 1 - startTag.getDay()
  startTag.setDate(startTag.getDate() + diff)

  const wochen: Date[][] = []
  const aktuell = new Date(startTag)

  while (aktuell <= letzterTag || wochen.length < 5) {
    const woche: Date[] = []
    for (let i = 0; i < 7; i++) {
      woche.push(new Date(aktuell))
      aktuell.setDate(aktuell.getDate() + 1)
    }
    wochen.push(woche)
    if (aktuell > letzterTag && wochen.length >= 4) break
  }

  return wochen
}

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONATE = ['Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

export function FristenKalender({ checklisten, mandantNamen }: FristenKalenderProps) {
  const [ansicht, setAnsicht] = useState<Ansicht>('woche')
  const [referenzDatum, setReferenzDatum] = useState(new Date())
  const [ausgewaehlt, setAusgewaehlt] = useState<string | null>(datumKey(new Date()))
  const erinnerung = useErinnerungSenden()

  // Checklisten nach Frist-Datum gruppieren
  const fristenProTag = useMemo(() => {
    const map = new Map<string, ChecklisteMitDokumente[]>()
    for (const cl of checklisten) {
      if (cl.status === 'vollstaendig') continue
      const key = cl.frist.split('T')[0]
      const liste = map.get(key) ?? []
      liste.push(cl)
      map.set(key, liste)
    }
    return map
  }, [checklisten])

  // Navigation
  const navigieren = (richtung: number) => {
    const neu = new Date(referenzDatum)
    if (ansicht === 'woche') {
      neu.setDate(neu.getDate() + richtung * 7)
    } else {
      neu.setMonth(neu.getMonth() + richtung)
    }
    setReferenzDatum(neu)
  }

  const zurueckSetzen = () => {
    setReferenzDatum(new Date())
    setAusgewaehlt(datumKey(new Date()))
  }

  // Ausgewaehlte Checklisten
  const ausgewaehlteListe = ausgewaehlt ? (fristenProTag.get(ausgewaehlt) ?? []) : []

  // Titel
  const titel = ansicht === 'woche'
    ? (() => {
        const tage = wochenTage(referenzDatum)
        return `${tage[0].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - ${tage[6].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
      })()
    : `${MONATE[referenzDatum.getMonth()]} ${referenzDatum.getFullYear()}`

  const heute = datumKey(new Date())

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Fristen-Kalender</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={zurueckSetzen} className="text-xs">
              Heute
            </Button>
            <div className="flex rounded-lg border">
              <Button
                variant={ansicht === 'woche' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setAnsicht('woche')}
                className="rounded-r-none text-xs"
              >
                Woche
              </Button>
              <Button
                variant={ansicht === 'monat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setAnsicht('monat')}
                className="rounded-l-none text-xs"
              >
                Monat
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigieren(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{titel}</span>
          <Button variant="ghost" size="sm" onClick={() => navigieren(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Kalender-Grid */}
        {ansicht === 'woche' ? (
          <WochenAnsicht
            tage={wochenTage(referenzDatum)}
            fristenProTag={fristenProTag}
            heute={heute}
            ausgewaehlt={ausgewaehlt}
            onAuswaehlen={setAusgewaehlt}
          />
        ) : (
          <MonatsAnsicht
            jahr={referenzDatum.getFullYear()}
            monat={referenzDatum.getMonth()}
            fristenProTag={fristenProTag}
            heute={heute}
            ausgewaehlt={ausgewaehlt}
            onAuswaehlen={setAusgewaehlt}
          />
        )}

        {/* Detail-Liste fuer ausgewaehlten Tag */}
        {ausgewaehlt && ausgewaehlteListe.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">
              {new Date(ausgewaehlt + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}
              {' — '}{ausgewaehlteListe.length} {ausgewaehlteListe.length === 1 ? 'Frist' : 'Fristen'}
            </p>
            {ausgewaehlteListe.map((cl) => {
              const offeneDoks = cl.dokumente.filter((d) => d.pflicht && d.status === 'ausstehend').length
              const gesamtDoks = cl.dokumente.filter((d) => d.pflicht).length

              return (
                <div key={cl.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/app/mandanten/${cl.mandant_id}`}
                      className="font-medium hover:underline"
                    >
                      {mandantNamen[cl.mandant_id] ?? 'Unbekannt'}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">{cl.titel}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn(
                        'text-xs',
                        offeneDoks === 0 ? 'border-ampel-gruen text-ampel-gruen' :
                        offeneDoks >= gesamtDoks ? 'border-ampel-rot text-ampel-rot' :
                        'border-ampel-gelb text-ampel-gelb'
                      )}>
                        {offeneDoks} von {gesamtDoks} offen
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1"
                    disabled={erinnerung.isPending}
                    onClick={() => {
                      erinnerung.mutate(
                        { checklisteId: cl.id, typ: 'manuell' },
                        {
                          onSuccess: () => toast({ titel: 'Erinnerung gesendet', variante: 'success' }),
                          onError: () => toast({ titel: 'Fehler beim Senden', variante: 'destructive' }),
                        }
                      )
                    }}
                  >
                    <Send className="h-3 w-3" />
                    Erinnern
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Wochen-Ansicht
interface KalenderAnsichtProps {
  fristenProTag: Map<string, ChecklisteMitDokumente[]>
  heute: string
  ausgewaehlt: string | null
  onAuswaehlen: (key: string) => void
}

function WochenAnsicht({ tage, fristenProTag, heute, ausgewaehlt, onAuswaehlen }: KalenderAnsichtProps & { tage: Date[] }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {WOCHENTAGE.map((tag) => (
        <div key={tag} className="text-center text-xs font-medium text-muted-foreground py-1">
          {tag}
        </div>
      ))}
      {tage.map((tag) => {
        const key = datumKey(tag)
        const fristen = fristenProTag.get(key) ?? []
        const istHeute = key === heute
        const istAusgewaehlt = key === ausgewaehlt
        const hatUeberfaellige = fristen.some((c) => c.tage_bis_frist < 0)

        return (
          <button
            key={key}
            onClick={() => onAuswaehlen(key)}
            className={cn(
              'flex flex-col items-center rounded-lg p-2 text-sm transition-colors min-h-[60px]',
              istAusgewaehlt ? 'bg-primary text-primary-foreground' :
              istHeute ? 'bg-muted ring-1 ring-primary' :
              'hover:bg-muted/50',
            )}
          >
            <span className="font-medium">{tag.getDate()}</span>
            {fristen.length > 0 && (
              <div className="flex gap-0.5 mt-1">
                {fristen.length <= 3 ? (
                  fristen.map((_, i) => (
                    <span key={i} className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      hatUeberfaellige ? 'bg-ampel-rot' :
                      istAusgewaehlt ? 'bg-primary-foreground' : 'bg-ampel-gelb'
                    )} />
                  ))
                ) : (
                  <span className={cn(
                    'text-xs font-bold',
                    istAusgewaehlt ? '' : hatUeberfaellige ? 'text-ampel-rot' : 'text-ampel-gelb'
                  )}>
                    {fristen.length}
                  </span>
                )}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// Monats-Ansicht
function MonatsAnsicht({ jahr, monat, fristenProTag, heute, ausgewaehlt, onAuswaehlen }: KalenderAnsichtProps & { jahr: number; monat: number }) {
  const wochen = monatsTage(jahr, monat)

  return (
    <div>
      <div className="grid grid-cols-7 gap-1">
        {WOCHENTAGE.map((tag) => (
          <div key={tag} className="text-center text-xs font-medium text-muted-foreground py-1">
            {tag}
          </div>
        ))}
      </div>
      {wochen.map((woche, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1">
          {woche.map((tag) => {
            const key = datumKey(tag)
            const fristen = fristenProTag.get(key) ?? []
            const istImMonat = tag.getMonth() === monat
            const istHeute = key === heute
            const istAusgewaehlt = key === ausgewaehlt
            const hatUeberfaellige = fristen.some((c) => c.tage_bis_frist < 0)

            return (
              <button
                key={key}
                onClick={() => onAuswaehlen(key)}
                className={cn(
                  'flex flex-col items-center rounded-lg p-1.5 text-xs transition-colors min-h-[44px]',
                  !istImMonat && 'opacity-30',
                  istAusgewaehlt ? 'bg-primary text-primary-foreground' :
                  istHeute ? 'bg-muted ring-1 ring-primary' :
                  'hover:bg-muted/50',
                )}
              >
                <span>{tag.getDate()}</span>
                {fristen.length > 0 && (
                  <span className={cn(
                    'text-[10px] font-bold mt-0.5',
                    istAusgewaehlt ? '' :
                    hatUeberfaellige ? 'text-ampel-rot' : 'text-ampel-gelb'
                  )}>
                    {fristen.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
