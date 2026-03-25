import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { MandantKarte } from '../components/MandantKarte'
import { useMandanten } from '../hooks/useMandanten'

export function MandantenPage() {
  const { data: mandanten, isLoading } = useMandanten()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mandanten</h1>
        <Link to="/app/mandanten/neu">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Neuer Mandant
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mandanten?.map((m) => (
            <MandantKarte key={m.id} mandant={m} />
          ))}
          {mandanten?.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-12">
              Noch keine Mandanten angelegt.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
