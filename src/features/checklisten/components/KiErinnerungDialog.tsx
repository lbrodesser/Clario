import { useState } from 'react'
import { Sparkles, Send, RotateCcw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useKiErinnerungGenerieren } from '../hooks/useKiErinnerung'
import { useErinnerungSenden } from '../hooks/useChecklisten'
import { toast } from '@/shared/hooks/useToast'

interface KiErinnerungDialogProps {
  checklisteId: string
  checklisteTitel: string
  mandantName: string
}

export function KiErinnerungDialog({ checklisteId, checklisteTitel, mandantName }: KiErinnerungDialogProps) {
  const [offen, setOffen] = useState(false)
  const [anweisungen, setAnweisungen] = useState('')
  const [entwurf, setEntwurf] = useState<{
    betreff: string
    text: string
    empfaenger: string
    offeneDokumente: string[]
    erledigteDokumente: string[]
  } | null>(null)

  const generieren = useKiErinnerungGenerieren()
  const senden = useErinnerungSenden()

  const handleGenerieren = () => {
    generieren.mutate(
      { checklisteId, anweisungen: anweisungen || undefined },
      {
        onSuccess: (data) => setEntwurf(data),
        onError: () => toast({ titel: 'KI-Entwurf konnte nicht erstellt werden', variante: 'destructive' }),
      }
    )
  }

  const handleSenden = () => {
    senden.mutate(
      { checklisteId, typ: 'manuell' },
      {
        onSuccess: () => {
          toast({ titel: `Erinnerung an ${mandantName} gesendet`, variante: 'success' })
          setOffen(false)
          setEntwurf(null)
          setAnweisungen('')
        },
        onError: () => toast({ titel: 'Mail konnte nicht gesendet werden', variante: 'destructive' }),
      }
    )
  }

  if (!offen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => {
          setOffen(true)
          handleGenerieren()
        }}
      >
        <Sparkles className="h-3 w-3" />
        KI-Erinnerung
      </Button>
    )
  }

  return (
    <Card className="mt-4 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            KI-Erinnerung an {mandantName}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => { setOffen(false); setEntwurf(null) }}>
            Schließen
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{checklisteTitel}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Anweisungen */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Optionale Hinweise für die KI (z.B. "Steuerbescheid war unleserlich"):
          </label>
          <textarea
            value={anweisungen}
            onChange={(e) => setAnweisungen(e.target.value)}
            placeholder="z.B. Bitte auch nach der Lohnsteuerbescheinigung fragen..."
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[60px] resize-none"
          />
        </div>

        {/* Generierung läuft */}
        {generieren.isPending && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {/* Mail-Vorschau */}
        {entwurf && (
          <div className="space-y-3">
            {/* Status-Badges */}
            <div className="flex flex-wrap gap-2">
              {entwurf.erledigteDokumente.length > 0 && (
                <Badge variant="outline" className="text-xs border-ampel-gruen text-ampel-gruen">
                  {entwurf.erledigteDokumente.length} eingereicht
                </Badge>
              )}
              {entwurf.offeneDokumente.length > 0 && (
                <Badge variant="outline" className="text-xs border-ampel-rot text-ampel-rot">
                  {entwurf.offeneDokumente.length} offen
                </Badge>
              )}
            </div>

            {/* Betreff */}
            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Betreff:</p>
              <p className="text-sm font-medium">{entwurf.betreff}</p>
            </div>

            {/* Mail-Text */}
            <div className="rounded-lg border p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Vorschau:</p>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {entwurf.text}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              An: {entwurf.empfaenger}
            </p>

            {/* Aktionen */}
            <div className="flex gap-2">
              <Button
                onClick={handleSenden}
                disabled={senden.isPending}
                className="flex-1 gap-2"
              >
                <Send className="h-4 w-4" />
                {senden.isPending ? 'Wird gesendet...' : 'Senden'}
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerieren}
                disabled={generieren.isPending}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Neu generieren
              </Button>
            </div>
          </div>
        )}

        {/* Fehler */}
        {generieren.isError && (
          <div className="text-sm text-destructive">
            Mail-Entwurf konnte nicht erstellt werden. Bitte erneut versuchen.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
