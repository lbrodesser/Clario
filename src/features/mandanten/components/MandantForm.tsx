import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { mandantTypLabel } from '@/shared/lib/utils'
import type { MandantTyp } from '@/shared/types'

const mandantSchema = z.object({
  name: z.string().min(2, 'Name erforderlich'),
  email: z.string().email('Gueltige E-Mail erforderlich'),
  typ: z.enum(['privatperson', 'freiberufler', 'kleingewerbe', 'gmbh_ug', 'personengesellschaft', 'verein', 'pv_betreiber'] as const),
  steuer_id: z.string().optional(),
  notizen: z.string().optional(),
  ist_heilberuf: z.boolean().optional(),
})

type MandantFormDaten = z.infer<typeof mandantSchema>

interface MandantFormProps {
  initialDaten?: Partial<MandantFormDaten>
  onSubmit: (daten: MandantFormDaten) => void
  isLoading?: boolean
}

const mandantTypen: MandantTyp[] = [
  'privatperson', 'freiberufler', 'kleingewerbe', 'gmbh_ug',
  'personengesellschaft', 'verein', 'pv_betreiber',
]

export function MandantForm({ initialDaten, onSubmit, isLoading }: MandantFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<MandantFormDaten>({
    resolver: zodResolver(mandantSchema),
    defaultValues: {
      typ: 'privatperson',
      ...initialDaten,
    },
  })

  const typ = watch('typ')

  return (
    <form onSubmit={handleSubmit(onSubmit, (validationErrors) => console.error('Formular-Validierung fehlgeschlagen:', validationErrors))} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Max Mustermann" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" type="email" placeholder="mandant@beispiel.de" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Mandantentyp</Label>
          <Select value={typ} onValueChange={(val) => setValue('typ', val as MandantTyp)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mandantTypen.map((t) => (
                <SelectItem key={t} value={t}>{mandantTypLabel(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="steuer_id">Steuer-ID (optional)</Label>
          <Input id="steuer_id" placeholder="12 345 678 901" {...register('steuer_id')} />
        </div>
      </div>

      {typ === 'freiberufler' && (
        <div className="flex items-center gap-2">
          <input type="checkbox" id="ist_heilberuf" {...register('ist_heilberuf')} className="h-4 w-4" />
          <Label htmlFor="ist_heilberuf">Heilberuf (Arzt, Zahnarzt, Therapeut etc.)</Label>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notizen">Notizen (optional)</Label>
        <Textarea id="notizen" placeholder="Interne Notizen zum Mandanten..." {...register('notizen')} />
      </div>

      {/* Validierungsfehler anzeigen */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg border border-destructive p-3">
          <p className="text-sm font-medium text-destructive">Bitte pruefen Sie folgende Felder:</p>
          <ul className="mt-1 list-disc pl-4 text-sm text-destructive">
            {Object.entries(errors).map(([feld, fehler]) => (
              <li key={feld}>{feld}: {fehler?.message ?? 'Ungueltig'}</li>
            ))}
          </ul>
        </div>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Wird gespeichert...' : 'Mandant speichern'}
      </Button>
    </form>
  )
}
