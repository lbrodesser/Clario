import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Send } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { AmpelBadge } from './AmpelBadge'
import { formatDatum, mandantTypLabel } from '@/shared/lib/utils'
import type { MandantMitStatus } from '@/shared/types'

interface MandantenTabelleProps {
  mandanten: MandantMitStatus[]
}

type FilterTab = 'alle' | 'ausstehend' | 'ueberfaellig' | 'diese_woche'

export function MandantenTabelle({ mandanten }: MandantenTabelleProps) {
  const [filter, setFilter] = useState<FilterTab>('alle')

  const gefiltert = mandanten
    .filter((m) => {
      if (filter === 'ausstehend') return m.ampel !== 'gruen'
      if (filter === 'ueberfaellig') return m.ampel === 'rot'
      if (filter === 'diese_woche') {
        return m.checklisten.some((c) => c.tage_bis_frist >= 0 && c.tage_bis_frist <= 7)
      }
      return true
    })
    .sort((a, b) => {
      const aFrist = a.checklisten[0]?.frist ?? '9999-12-31'
      const bFrist = b.checklisten[0]?.frist ?? '9999-12-31'
      return aFrist.localeCompare(bFrist)
    })

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'alle', label: 'Alle' },
    { key: 'ausstehend', label: 'Ausstehend' },
    { key: 'ueberfaellig', label: 'Ueberfaellig' },
    { key: 'diese_woche', label: 'Diese Woche' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Mandant</th>
              <th className="px-4 py-3 text-left font-medium">Typ</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-center font-medium">Offen</th>
              <th className="px-4 py-3 text-left font-medium">Naechste Frist</th>
              <th className="px-4 py-3 text-right font-medium">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {gefiltert.map((m) => {
              const naechsteFrist = m.checklisten
                .filter((c) => c.status !== 'vollstaendig')
                .sort((a, b) => a.frist.localeCompare(b.frist))[0]?.frist

              return (
                <tr key={m.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      to={`/app/mandanten/${m.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{mandantTypLabel(m.typ)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <AmpelBadge farbe={m.ampel} />
                  </td>
                  <td className="px-4 py-3 text-center">{m.offene_dokumente}</td>
                  <td className="px-4 py-3">
                    {naechsteFrist ? formatDatum(naechsteFrist) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Send className="h-3 w-3" />
                      Erinnerung
                    </Button>
                  </td>
                </tr>
              )
            })}
            {gefiltert.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Keine Mandanten gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
