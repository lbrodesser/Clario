import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useVorlagen, useChecklisteErstellen } from '../hooks/useChecklisten'
import type { MandantTyp } from '@/shared/types'

type WiederholungIntervall = 'monatlich' | 'quartalsweise' | 'jaehrlich'

interface VorlagenAuswahlProps {
  mandantId: string
  mandantTyp: MandantTyp
  onErstellt: () => void
}

export function VorlagenAuswahl({ mandantId, mandantTyp, onErstellt }: VorlagenAuswahlProps) {
  const { data: vorlagen, isLoading } = useVorlagen(mandantTyp)
  const erstellen = useChecklisteErstellen()
  const [ausgewaehlt, setAusgewaehlt] = useState<string | null>(null)
  const [frist, setFrist] = useState('')
  const [titel, setTitel] = useState('')
  const [intervall, setIntervall] = useState<WiederholungIntervall>('monatlich')

  const ausgewaehlteVorlage = vorlagen?.find((v) => v.id === ausgewaehlt)

  const handleErstellen = () => {
    if (!ausgewaehlt || !frist || !titel || !ausgewaehlteVorlage) return
    erstellen.mutate(
      {
        mandantId,
        vorlageId: ausgewaehlt,
        titel,
        frist,
        checklisteTyp: ausgewaehlteVorlage.checkliste_typ,
        wiederholungIntervall: ausgewaehlteVorlage.checkliste_typ === 'wiederkehrend'
          ? intervall
          : undefined,
      },
      { onSuccess: onErstellt }
    )
  }

  if (isLoading) return <Skeleton className="h-32" />

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {vorlagen?.map((v) => (
          <Card
            key={v.id}
            className={`cursor-pointer transition-colors ${ausgewaehlt === v.id ? 'border-primary ring-2 ring-primary' : 'hover:bg-muted/30'}`}
            onClick={() => {
              setAusgewaehlt(v.id)
              setTitel(v.name)
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{v.name}</CardTitle>
            </CardHeader>
            {v.beschreibung && (
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">{v.beschreibung}</p>
              </CardContent>
            )}
          </Card>
        ))}
        {(!vorlagen || vorlagen.length === 0) && (
          <p className="col-span-full text-sm text-muted-foreground">
            Keine Vorlagen für diesen Mandantentyp verfügbar.
          </p>
        )}
      </div>

      {ausgewaehlteVorlage && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="space-y-2">
            <Label htmlFor="titel">Titel</Label>
            <Input
              id="titel"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="z.B. Einkommensteuer 2024"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frist">Frist</Label>
            <Input
              id="frist"
              type="date"
              value={frist}
              onChange={(e) => setFrist(e.target.value)}
            />
          </div>
          {ausgewaehlteVorlage.checkliste_typ === 'wiederkehrend' && (
            <div className="space-y-2">
              <Label>Wiederholung</Label>
              <div className="flex gap-2">
                {(['monatlich', 'quartalsweise', 'jaehrlich'] as const).map((opt) => (
                  <Button
                    key={opt}
                    type="button"
                    variant={intervall === opt ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setIntervall(opt)}
                  >
                    {opt === 'monatlich' ? 'Monatlich' : opt === 'quartalsweise' ? 'Quartalsweise' : 'Jährlich'}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <Button
            onClick={handleErstellen}
            disabled={!frist || !titel || erstellen.isPending}
          >
            {erstellen.isPending ? 'Wird erstellt...' : 'Checkliste erstellen'}
          </Button>
        </div>
      )}
    </div>
  )
}
