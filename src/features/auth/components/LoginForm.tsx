import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { useLogin } from '../hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('Bitte gueltige E-Mail-Adresse eingeben'),
  passwort: z.string().min(6, 'Mindestens 6 Zeichen'),
})

type LoginFormDaten = z.infer<typeof loginSchema>

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormDaten>({
    resolver: zodResolver(loginSchema),
  })
  const login = useLogin()

  const onSubmit = (daten: LoginFormDaten) => {
    login.mutate(daten)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Anmelden</CardTitle>
        <CardDescription>
          Melden Sie sich bei Ihrem Clario-Konto an
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="kanzlei@beispiel.de"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwort">Passwort</Label>
            <Input
              id="passwort"
              type="password"
              {...register('passwort')}
            />
            {errors.passwort && (
              <p className="text-sm text-destructive">{errors.passwort.message}</p>
            )}
          </div>
          {login.error && (
            <p className="text-sm text-destructive">
              Anmeldung fehlgeschlagen. Bitte pruefen Sie Ihre Zugangsdaten.
            </p>
          )}
          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? 'Wird angemeldet...' : 'Anmelden'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
