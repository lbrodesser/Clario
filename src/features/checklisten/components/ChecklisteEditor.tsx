import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { VorlagenAuswahl } from './VorlagenAuswahl'
import { DokumentZeile } from './DokumentZeile'
import { MagicLinkPanel } from './MagicLinkPanel'
import { ErinnerungSenden } from './ErinnerungSenden'
import { KiErinnerungDialog } from './KiErinnerungDialog'
import { formatDatum } from '@/shared/lib/utils'
import type { ChecklisteMitDokumente, MandantTyp } from '@/shared/types'

interface ChecklisteEditorProps {
  mandantId: string
  mandantTyp: MandantTyp
  mandantName: string
  checklisten: ChecklisteMitDokumente[]
}

export function ChecklisteEditor({ mandantId, mandantTyp, mandantName, checklisten }: ChecklisteEditorProps) {
  const [zeigeVorlagen, setZeigeVorlagen] = useState(false)
  const [expandiert, setExpandiert] = useState<Set<string>>(new Set())

  const toggleExpandiert = (id: string) => {
    setExpandiert((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const statusFarbe = {
    offen: 'bg-muted text-muted-foreground',
    teilweise: 'bg-ampel-gelb/20 text-ampel-gelb',
    vollstaendig: 'bg-ampel-gruen/20 text-ampel-gruen',
    ueberfaellig: 'bg-ampel-rot/20 text-ampel-rot',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Checklisten</h3>
        <Button size="sm" className="gap-1" onClick={() => setZeigeVorlagen(!zeigeVorlagen)}>
          <Plus className="h-4 w-4" />
          Neue Checkliste
        </Button>
      </div>

      {zeigeVorlagen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vorlage wählen</CardTitle>
          </CardHeader>
          <CardContent>
            <VorlagenAuswahl
              mandantId={mandantId}
              mandantTyp={mandantTyp}
              onErstellt={() => setZeigeVorlagen(false)}
            />
          </CardContent>
        </Card>
      )}

      {checklisten.map((cl) => (
        <Card key={cl.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">{cl.titel}</CardTitle>
                <Badge className={statusFarbe[cl.status]}>{cl.status}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <ErinnerungSenden checklisteId={cl.id} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpandiert(cl.id)}
                >
                  {expandiert.has(cl.id)
                    ? <ChevronUp className="h-4 w-4" />
                    : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Frist: {formatDatum(cl.frist)}</span>
              <span>{cl.fortschritt}% abgeschlossen</span>
            </div>
            <Progress value={cl.fortschritt} className="h-2" />
          </CardHeader>

          {expandiert.has(cl.id) && (
            <CardContent className="space-y-4">
              <MagicLinkPanel portalToken={cl.portal_token} />
              <div className="space-y-2">
                {cl.dokumente.map((dok) => (
                  <DokumentZeile key={dok.id} dokument={dok} />
                ))}
              </div>
              {cl.status !== 'vollstaendig' && (
                <KiErinnerungDialog
                  checklisteId={cl.id}
                  checklisteTitel={cl.titel}
                  mandantName={mandantName}
                />
              )}
            </CardContent>
          )}
        </Card>
      ))}

      {checklisten.length === 0 && !zeigeVorlagen && (
        <p className="py-8 text-center text-muted-foreground">
          Noch keine Checklisten vorhanden.
        </p>
      )}
    </div>
  )
}
