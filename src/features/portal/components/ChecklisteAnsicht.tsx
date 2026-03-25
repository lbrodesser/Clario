import { Check, Clock, X, CheckCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { DokumentUploadBereich } from './DokumentUploadBereich'
import { formatDateigroesse } from '@/shared/lib/utils'
import type { ChecklisteMitDokumente, MandantTyp } from '@/shared/types'

interface ChecklisteAnsichtProps {
  checkliste: ChecklisteMitDokumente
  portalToken: string
  mandantTyp: MandantTyp
}

export function ChecklisteAnsicht({ checkliste, portalToken, mandantTyp }: ChecklisteAnsichtProps) {
  const statusConfig = {
    ausstehend: { icon: Clock, farbe: 'text-muted-foreground', bg: '' },
    hochgeladen: { icon: Check, farbe: 'text-ampel-gruen', bg: 'bg-ampel-gruen/5' },
    geprueft: { icon: CheckCheck, farbe: 'text-green-800', bg: 'bg-green-50' },
    abgelehnt: { icon: X, farbe: 'text-ampel-rot', bg: 'bg-red-50' },
  }

  return (
    <div className="space-y-4">
      {checkliste.dokumente.map((dok) => {
        const config = statusConfig[dok.status]
        const Icon = config.icon

        return (
          <Card key={dok.id} className={config.bg}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.farbe}`} />
                  <div>
                    <CardTitle className="text-base">{dok.titel}</CardTitle>
                    {dok.beschreibung && (
                      <p className="text-sm text-muted-foreground mt-1">{dok.beschreibung}</p>
                    )}
                  </div>
                </div>
                {!dok.pflicht && <Badge variant="outline">Optional</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              {/* Bereits hochgeladene Dateien anzeigen */}
              {dok.dateien.length > 0 && (
                <div className="mb-3 space-y-1">
                  {dok.dateien.map((datei) => (
                    <div key={datei.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3 w-3 text-ampel-gruen" />
                      <span>{datei.dateiname}</span>
                      {datei.dateigroesse_kb && (
                        <span>({formatDateigroesse(datei.dateigroesse_kb)})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload-Bereich fuer ausstehende Dokumente */}
              {(dok.status === 'ausstehend' || (dok.status === 'abgelehnt')) && (
                <DokumentUploadBereich
                  dokument={dok}
                  portalToken={portalToken}
                  mandantTyp={mandantTyp}
                  checklisteId={checkliste.id}
                />
              )}

              {/* Mehrdatei: auch bei hochgeladen weiterer Upload moeglich */}
              {dok.mehrdatei_erlaubt && dok.status === 'hochgeladen' && (
                <DokumentUploadBereich
                  dokument={{ ...dok, status: 'ausstehend' }}
                  portalToken={portalToken}
                  mandantTyp={mandantTyp}
                  checklisteId={checkliste.id}
                />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
