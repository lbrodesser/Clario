import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { AmpelBadge } from '@/features/dashboard/components/AmpelBadge'
import { useMandantenMitStatus } from '@/features/dashboard/hooks/useDashboard'
import { mandantTypLabel, formatDatum } from '@/shared/lib/utils'
import type { MandantMitStatus, MandantTyp } from '@/shared/types'

type SortSpalte = 'name' | 'typ' | 'ampel' | 'offene' | 'frist'
type SortRichtung = 'asc' | 'desc'

const TYPEN_FILTER: { label: string; value: MandantTyp | 'alle' }[] = [
  { label: 'Alle', value: 'alle' },
  { label: 'Privatperson', value: 'privatperson' },
  { label: 'Freiberufler', value: 'freiberufler' },
  { label: 'Kleingewerbe', value: 'kleingewerbe' },
  { label: 'GmbH/UG', value: 'gmbh_ug' },
  { label: 'PV-Betreiber', value: 'pv_betreiber' },
  { label: 'Verein', value: 'verein' },
  { label: 'Personenges.', value: 'personengesellschaft' },
]

const AMPEL_PRIORITAET = { rot: 0, gelb: 1, gruen: 2 }

export function MandantenPage() {
  const { data: mandanten, isLoading } = useMandantenMitStatus()
  const [suche, setSuche] = useState('')
  const [typFilter, setTypFilter] = useState<MandantTyp | 'alle'>('alle')
  const [sortSpalte, setSortSpalte] = useState<SortSpalte>('name')
  const [sortRichtung, setSortRichtung] = useState<SortRichtung>('asc')

  const handleSort = (spalte: SortSpalte) => {
    if (sortSpalte === spalte) {
      setSortRichtung(sortRichtung === 'asc' ? 'desc' : 'asc')
    } else {
      setSortSpalte(spalte)
      setSortRichtung(spalte === 'ampel' || spalte === 'offene' ? 'desc' : 'asc')
    }
  }

  const gefilterteMandanten = useMemo(() => {
    if (!mandanten) return []

    let liste = [...mandanten]

    // Suchfilter
    if (suche) {
      const s = suche.toLowerCase()
      liste = liste.filter(
        (m) =>
          m.name.toLowerCase().includes(s) ||
          m.email.toLowerCase().includes(s) ||
          mandantTypLabel(m.typ).toLowerCase().includes(s)
      )
    }

    // Typfilter
    if (typFilter !== 'alle') {
      liste = liste.filter((m) => m.typ === typFilter)
    }

    // Sortierung
    liste.sort((a, b) => {
      const richtung = sortRichtung === 'asc' ? 1 : -1

      switch (sortSpalte) {
        case 'name':
          return a.name.localeCompare(b.name) * richtung
        case 'typ':
          return mandantTypLabel(a.typ).localeCompare(mandantTypLabel(b.typ)) * richtung
        case 'ampel':
          return (AMPEL_PRIORITAET[a.ampel] - AMPEL_PRIORITAET[b.ampel]) * richtung
        case 'offene':
          return (a.offene_dokumente - b.offene_dokumente) * richtung
        case 'frist': {
          const fristA = naechsteFrist(a)
          const fristB = naechsteFrist(b)
          if (!fristA && !fristB) return 0
          if (!fristA) return 1
          if (!fristB) return -1
          return fristA.localeCompare(fristB) * richtung
        }
        default:
          return 0
      }
    })

    return liste
  }, [mandanten, suche, typFilter, sortSpalte, sortRichtung])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mandanten</h1>
          {mandanten && (
            <p className="text-sm text-muted-foreground">
              {mandanten.length} Mandanten gesamt
              {suche || typFilter !== 'alle' ? ` (${gefilterteMandanten.length} angezeigt)` : ''}
            </p>
          )}
        </div>
        <Link to="/app/mandanten/neu">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Neuer Mandant
          </Button>
        </Link>
      </div>

      {/* Suche + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Name, E-Mail oder Typ suchen..."
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {TYPEN_FILTER.map((f) => (
            <Button
              key={f.value}
              variant={typFilter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypFilter(f.value)}
              className="text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabelle */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <SortHeader
                  label="Name"
                  spalte="name"
                  aktiv={sortSpalte}
                  richtung={sortRichtung}
                  onClick={handleSort}
                />
                <SortHeader
                  label="Typ"
                  spalte="typ"
                  aktiv={sortSpalte}
                  richtung={sortRichtung}
                  onClick={handleSort}
                  className="hidden sm:table-cell"
                />
                <SortHeader
                  label="Status"
                  spalte="ampel"
                  aktiv={sortSpalte}
                  richtung={sortRichtung}
                  onClick={handleSort}
                />
                <SortHeader
                  label="Offen"
                  spalte="offene"
                  aktiv={sortSpalte}
                  richtung={sortRichtung}
                  onClick={handleSort}
                />
                <SortHeader
                  label="Naechste Frist"
                  spalte="frist"
                  aktiv={sortSpalte}
                  richtung={sortRichtung}
                  onClick={handleSort}
                  className="hidden md:table-cell"
                />
                <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden lg:table-cell">
                  GwG
                </th>
              </tr>
            </thead>
            <tbody>
              {gefilterteMandanten.map((m) => (
                <MandantZeile key={m.id} mandant={m} />
              ))}
              {gefilterteMandanten.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    {suche ? 'Keine Mandanten gefunden.' : 'Noch keine Mandanten angelegt.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Hilfsfunktion: naechste Frist eines Mandanten
function naechsteFrist(mandant: MandantMitStatus): string | null {
  const offeneChecklisten = mandant.checklisten.filter(
    (cl) => cl.status !== 'vollstaendig'
  )
  if (offeneChecklisten.length === 0) return null
  return offeneChecklisten.reduce((min, cl) =>
    cl.frist < min ? cl.frist : min, offeneChecklisten[0].frist
  )
}

// Sortierbare Spalten-Header
interface SortHeaderProps {
  label: string
  spalte: SortSpalte
  aktiv: SortSpalte
  richtung: SortRichtung
  onClick: (spalte: SortSpalte) => void
  className?: string
}

function SortHeader({ label, spalte, aktiv, richtung, onClick, className }: SortHeaderProps) {
  return (
    <th
      className={`px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none ${className ?? ''}`}
      onClick={() => onClick(spalte)}
    >
      <div className="flex items-center gap-1">
        {label}
        {aktiv === spalte && (
          richtung === 'asc'
            ? <ChevronUp className="h-3 w-3" />
            : <ChevronDown className="h-3 w-3" />
        )}
      </div>
    </th>
  )
}

// Einzelne Mandant-Zeile
function MandantZeile({ mandant }: { mandant: MandantMitStatus }) {
  const frist = naechsteFrist(mandant)

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <Link to={`/app/mandanten/${mandant.id}`} className="hover:underline">
          <p className="font-medium">{mandant.name}</p>
          <p className="text-xs text-muted-foreground">{mandant.email}</p>
        </Link>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <Badge variant="outline" className="text-xs">
          {mandantTypLabel(mandant.typ)}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <AmpelBadge farbe={mandant.ampel} />
      </td>
      <td className="px-4 py-3">
        {mandant.offene_dokumente > 0 ? (
          <span className="text-sm font-medium">{mandant.offene_dokumente}</span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {frist ? (
          <span className="text-sm">{formatDatum(frist)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-right hidden lg:table-cell">
        {mandant.gwg_identifiziert ? (
          <Badge variant="outline" className="text-xs border-ampel-gruen text-ampel-gruen">OK</Badge>
        ) : (
          <Badge variant="outline" className="text-xs border-ampel-rot text-ampel-rot">Offen</Badge>
        )}
      </td>
    </tr>
  )
}
