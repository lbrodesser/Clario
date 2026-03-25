import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import type { Kanzlei } from '@/shared/types'

const profilSchema = z.object({
  name: z.string().min(2, 'Kanzleiname erforderlich'),
})

type ProfilFormDaten = z.infer<typeof profilSchema>

interface KanzleiProfilFormProps {
  kanzlei: Kanzlei
}

export function KanzleiProfilForm({ kanzlei }: KanzleiProfilFormProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<ProfilFormDaten>({
    resolver: zodResolver(profilSchema),
    defaultValues: { name: kanzlei.name },
  })

  const aktualisieren = useMutation({
    mutationFn: async (daten: ProfilFormDaten) => {
      const { error } = await supabase
        .from('kanzleien')
        .update(daten)
        .eq('id', kanzlei.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanzlei'] })
    },
  })

  return (
    <form onSubmit={handleSubmit((d) => aktualisieren.mutate(d))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Kanzleiname</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <Button type="submit" disabled={aktualisieren.isPending}>
        {aktualisieren.isPending ? 'Wird gespeichert...' : 'Speichern'}
      </Button>
    </form>
  )
}
