import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { useRegister } from '../hooks/useAuth'

const registerSchema = z.object({
  kanzleiName: z.string().min(2, 'Bitte Kanzleiname eingeben'),
  email: z.string().email('Bitte gueltige E-Mail-Adresse eingeben'),
  passwort: z.string()
    .min(10, 'Mindestens 10 Zeichen')
    .regex(/\d/, 'Mindestens eine Zahl erforderlich'),
  passwortBestaetigung: z.string(),
}).refine((data) => data.passwort === data.passwortBestaetigung, {
  message: 'Passwoerter stimmen nicht ueberein',
  path: ['passwortBestaetigung'],
})

type RegisterFormDaten = z.infer<typeof registerSchema>

export function RegisterForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormDaten>({
    resolver: zodResolver(registerSchema),
  })
  const registrieren = useRegister()

  const onSubmit = (daten: RegisterFormDaten) => {
    registrieren.mutate(daten)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Kanzlei registrieren</CardTitle>
        <CardDescription>
          Erstellen Sie Ihr Clario-Konto. 14 Tage kostenlos testen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kanzleiName">Kanzleiname</Label>
            <Input
              id="kanzleiName"
              placeholder="Steuerberatung Muster"
              {...register('kanzleiName')}
            />
            {errors.kanzleiName && (
              <p className="text-sm text-destructive">{errors.kanzleiName.message}</p>
            )}
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="passwortBestaetigung">Passwort bestaetigen</Label>
            <Input
              id="passwortBestaetigung"
              type="password"
              {...register('passwortBestaetigung')}
            />
            {errors.passwortBestaetigung && (
              <p className="text-sm text-destructive">{errors.passwortBestaetigung.message}</p>
            )}
          </div>
          {registrieren.error && (
            <p className="text-sm text-destructive">
              {registrieren.error instanceof Error
                ? registrieren.error.message
                : 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.'}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={registrieren.isPending}>
            {registrieren.isPending ? 'Wird registriert...' : 'Kostenlos registrieren'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
