import { Check, Clock, X, CheckCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { DokumentUploadBereich } from './DokumentUploadBereich'
import { VorlageMitUnterschrift } from './VorlageMitUnterschrift'
import { formatDateigroesse } from '@/shared/lib/utils'
import type { ChecklisteMitDokumente, MandantTyp } from '@/shared/types'

interface ChecklisteAnsichtProps {
  checkliste: ChecklisteMitDokumente
  portalToken: string
  mandantTyp: MandantTyp
  mandantName: string
  kanzleiName: string
}

export function ChecklisteAnsicht({ checkliste, portalToken, mandantTyp, mandantName, kanzleiName }: ChecklisteAnsichtProps) {
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
        const istUnterschriftDok = dok.unterschrift_erforderlich === true
        const istPersonalausweis = dok.titel.includes('Personalausweis') && dok.mehrdatei_erlaubt

        return (
          <Card key={dok.id} className={config.bg}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.farbe}`} />
                  <div>
                    <CardTitle className="text-base">
                      {istUnterschriftDok && dok.status === 'ausstehend'
                        ? `${dok.titel.replace(' unterschrieben', '')} unterschreiben`
                        : dok.titel}
                    </CardTitle>
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
              {dok.dateien.length > 0 && !istUnterschriftDok && (
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

              {/* Unterschrift-Dokumente: VorlageMitUnterschrift */}
              {istUnterschriftDok && (
                <VorlageMitUnterschrift
                  dokument={dok}
                  portalToken={portalToken}
                  mandantName={mandantName}
                  kanzleiName={kanzleiName}
                />
              )}

              {/* Personalausweis: Vorder- und Rueckseite */}
              {!istUnterschriftDok && istPersonalausweis && (dok.status === 'ausstehend' || dok.status === 'abgelehnt' || dok.status === 'hochgeladen') && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Bitte fotografieren Sie Vorder- und Rueckseite Ihres Personalausweises separat.
                  </p>

                  {/* Bereits hochgeladene Dateien */}
                  {dok.dateien.length > 0 && (
                    <div className="space-y-1">
                      {dok.dateien.map((datei, idx) => (
                        <div key={datei.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-3 w-3 text-ampel-gruen" />
                          <span>{idx === 0 ? 'Vorderseite' : 'Rueckseite'}: {datei.dateiname}</span>
                          {datei.dateigroesse_kb && (
                            <span>({formatDateigroesse(datei.dateigroesse_kb)})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload fuer fehlende Seiten */}
                  {dok.dateien.length < 2 && (
                    <div className="space-y-3">
                      {dok.dateien.length === 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Vorderseite</p>
                          <DokumentUploadBereich
                            dokument={dok}
                            portalToken={portalToken}
                            mandantTyp={mandantTyp}
                            checklisteId={checkliste.id}
                          />
                        </div>
                      )}
                      {dok.dateien.length === 1 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Rueckseite</p>
                          <DokumentUploadBereich
                            dokument={{ ...dok, status: 'ausstehend' }}
                            portalToken={portalToken}
                            mandantTyp={mandantTyp}
                            checklisteId={checkliste.id}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Normale Dokumente: Upload-Bereich */}
              {!istUnterschriftDok && !istPersonalausweis && (dok.status === 'ausstehend' || dok.status === 'abgelehnt') && (
                <DokumentUploadBereich
                  dokument={dok}
                  portalToken={portalToken}
                  mandantTyp={mandantTyp}
                  checklisteId={checkliste.id}
                />
              )}

              {/* Mehrdatei (nicht Personalausweis): bei hochgeladen weiterer Upload moeglich */}
              {!istUnterschriftDok && !istPersonalausweis && dok.mehrdatei_erlaubt && dok.status === 'hochgeladen' && (
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
