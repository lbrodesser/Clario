import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { MandantForm } from '../components/MandantForm'
import { useMandantErstellen } from '../hooks/useMandanten'

export function MandantNeuPage() {
  const erstellen = useMandantErstellen()
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Neuen Mandanten anlegen</h1>
      <Card>
        <CardHeader>
          <CardTitle>Mandantendaten</CardTitle>
        </CardHeader>
        <CardContent>
          <MandantForm
            onSubmit={(daten) => {
              erstellen.mutate(daten, {
                onSuccess: (mandant) => navigate(`/app/mandanten/${mandant.id}`),
              })
            }}
            isLoading={erstellen.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
