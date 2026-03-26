import { ExternalLink } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { supabase } from '@/shared/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

// Feste Test-Portal-Tokens
const TEST_PORTALE = [
  { token: '11111111-1111-1111-1111-111111111111', mandant: 'Max Mustermann', typ: 'Privatperson', checkliste: 'Einkommensteuererklaerung 2025', dokumente: 9 },
  { token: '22222222-2222-2222-2222-222222222222', mandant: 'Dr. Lisa Freiberuf', typ: 'Freiberufler', checkliste: 'EUER 2025', dokumente: 5 },
  { token: '33333333-3333-3333-3333-333333333333', mandant: 'Klein & Fein GbR', typ: 'Kleingewerbe', checkliste: 'Finanzbuchhaltung Maerz 2026', dokumente: 5 },
  { token: '44444444-4444-4444-4444-444444444444', mandant: 'TechStart GmbH', typ: 'GmbH/UG', checkliste: 'GmbH Jahresabschluss 2025', dokumente: 5 },
  { token: '55555555-5555-5555-5555-555555555555', mandant: 'TechStart GmbH', typ: 'GmbH/UG', checkliste: 'Lohnbuchhaltung Maerz 2026', dokumente: 3 },
  { token: '66666666-6666-6666-6666-666666666666', mandant: 'Solar Schmidt', typ: 'PV-Betreiber', checkliste: 'Photovoltaik Steuererklaerung 2025', dokumente: 7 },
  { token: '77777777-7777-7777-7777-777777777777', mandant: 'Anna Neukunde', typ: 'Privatperson (GwG)', checkliste: 'GwG Neumandant Onboarding', dokumente: 3 },
  { token: 'afe54172-ccae-43c7-9aba-b375dc2f1142', mandant: 'Cristina Israel', typ: 'Privatperson (GwG)', checkliste: 'GwG Neumandant Onboarding (alt)', dokumente: 3 },
]

const DEV_EMAIL = 'dev@clario.de'
const DEV_PASSWORT = 'dev12345678'

export function DevTestPage() {
  const navigate = useNavigate()
  const [loginStatus, setLoginStatus] = useState('')

  const handleDevLogin = async () => {
    if (loginStatus === 'Wird angemeldet...') return // Doppelklick-Schutz
    setLoginStatus('Wird angemeldet...')

    const { error } = await supabase.auth.signInWithPassword({
      email: DEV_EMAIL,
      password: DEV_PASSWORT,
    })

    if (error) {
      setLoginStatus(`Login fehlgeschlagen: ${error.message}. Warte 60 Sekunden und versuche es erneut.`)
      return
    }

    navigate('/app/dashboard')
  }

  // Auch mit dem bestehenden Account einloggen
  const handleHauptLogin = async () => {
    if (loginStatus === 'Wird angemeldet...') return
    setLoginStatus('Wird angemeldet...')

    const { error } = await supabase.auth.signInWithPassword({
      email: 'l.brodesser@gmx.de',
      password: window.prompt('Passwort fuer l.brodesser@gmx.de:') ?? '',
    })

    if (error) {
      setLoginStatus(`Login fehlgeschlagen: ${error.message}`)
      return
    }

    navigate('/app/dashboard')
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Clario — Dev Testseite</h1>
        <p className="text-muted-foreground mt-1">
          Direktzugang zu allen Portal-Links und Dashboard. Nur für Entwicklung.
        </p>
      </div>

      {/* Dashboard Login */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kanzlei-Dashboard (Admin-Sicht)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={handleDevLogin}>
              Dev-Account (dev@clario.de)
            </Button>
            <Button variant="outline" onClick={handleHauptLogin}>
              Dein Account (l.brodesser)
            </Button>
          </div>
          {loginStatus && (
            <p className={`text-sm ${loginStatus.includes('fehlgeschlagen') ? 'text-destructive' : 'text-muted-foreground'}`}>
              {loginStatus}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Dev-Account: dev@clario.de / dev12345678
          </p>
        </CardContent>
      </Card>

      {/* Portal-Links */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Mandanten-Portale (Mandanten-Sicht)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Jeder Link oeffnet das Portal wie es der Mandant sehen würde. Kein Login nötig.
          Teste auf Desktop UND Handy (QR-Code oder Link kopieren).
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          {TEST_PORTALE.map((portal) => (
            <Card key={portal.token}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{portal.mandant}</p>
                  <Badge variant="outline" className="text-xs">{portal.typ}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{portal.checkliste} ({portal.dokumente} Dokumente)</p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={`/portal/${portal.token}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Portal öffnen
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Hinweise */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4 space-y-2 text-sm">
          <p className="font-medium">Test-Tipps:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li><strong>GwG-Flow testen:</strong> Anna Neukunde — Personalausweis + digitale Unterschrift</li>
            <li><strong>Unterschrift testen:</strong> Vorher unter Einstellungen Test-PDFs als Vollmacht/Datenschutz hochladen</li>
            <li><strong>Mobile testen:</strong> Portal-Link kopieren und am Handy öffnen</li>
            <li><strong>Verschiedene Eingabetypen:</strong> EUER hat Kombinations-Felder, PV hat Zahleneingaben</li>
            <li><strong>Dokumente:</strong> Du kannst beliebige Fotos/PDFs hochladen — es muss kein echtes Steuerdokument sein</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
