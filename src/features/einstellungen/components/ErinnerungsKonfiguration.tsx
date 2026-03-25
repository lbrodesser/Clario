import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import type { Kanzlei } from '@/shared/types'

interface ErinnerungsKonfigurationProps {
  kanzlei: Kanzlei
}

export function ErinnerungsKonfiguration({ kanzlei }: ErinnerungsKonfigurationProps) {
  const queryClient = useQueryClient()
  const [intervalle, setIntervalle] = useState(kanzlei.erinnerung_intervalle.tage.join(', '))
  const [kritisch, setKritisch] = useState(kanzlei.ampel_kritisch_tage.toString())
  const [warnung, setWarnung] = useState(kanzlei.ampel_warnung_tage.toString())

  const speichern = useMutation({
    mutationFn: async () => {
      const tage = intervalle.split(',').map((t) => parseInt(t.trim())).filter((t) => !isNaN(t))

      const { error } = await supabase
        .from('kanzleien')
        .update({
          erinnerung_intervalle: { tage },
          ampel_kritisch_tage: parseInt(kritisch),
          ampel_warnung_tage: parseInt(warnung),
        })
        .eq('id', kanzlei.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanzlei'] })
    },
  })

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="intervalle">Erinnerungsintervalle (Tage vor Frist, kommagetrennt)</Label>
        <Input
          id="intervalle"
          value={intervalle}
          onChange={(e) => setIntervalle(e.target.value)}
          placeholder="14, 7, 3"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="kritisch">Ampel Rot (Tage vor Frist)</Label>
          <Input
            id="kritisch"
            type="number"
            value={kritisch}
            onChange={(e) => setKritisch(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="warnung">Ampel Gelb (Tage vor Frist)</Label>
          <Input
            id="warnung"
            type="number"
            value={warnung}
            onChange={(e) => setWarnung(e.target.value)}
          />
        </div>
      </div>
      <Button onClick={() => speichern.mutate()} disabled={speichern.isPending}>
        {speichern.isPending ? 'Wird gespeichert...' : 'Einstellungen speichern'}
      </Button>
    </div>
  )
}
