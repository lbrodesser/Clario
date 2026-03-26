import { useState } from 'react'
import { Mail } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { supabase } from '@/shared/lib/supabase'

export function VerifyEmailPage() {
  const [gesendet, setGesendet] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const erneutSenden = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: '', // Supabase nutzt die Session-Email
      })
      if (!error) setGesendet(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>E-Mail bestätigen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Wir haben Ihnen einen Bestätigungslink geschickt.
            Bitte prüfen Sie Ihren Posteingang und klicken Sie auf den Link,
            um Ihr Konto zu aktivieren.
          </p>
          <p className="text-sm text-muted-foreground">
            Prüfen Sie auch Ihren Spam-Ordner.
          </p>

          {gesendet ? (
            <p className="text-sm text-ampel-gruen">Bestätigungsmail erneut gesendet.</p>
          ) : (
            <Button
              variant="outline"
              onClick={erneutSenden}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Wird gesendet...' : 'Bestätigungsmail erneut senden'}
            </Button>
          )}

          <Button variant="link" asChild>
            <a href="/login">Zurück zur Anmeldung</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
