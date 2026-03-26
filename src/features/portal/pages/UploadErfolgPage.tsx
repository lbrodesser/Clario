import { useParams, Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'

export function UploadErfolgPage() {
  const { token } = useParams<{ token: string }>()

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-4xl">&#10003;</div>
        <h1 className="text-xl font-bold">Vielen Dank!</h1>
        <p className="text-muted-foreground">
          Ihre Unterlagen wurden erfolgreich übermittelt.
        </p>
        <Link to={`/portal/${token}`}>
          <Button variant="outline" className="min-h-[48px]">
            Zurück zur Checkliste
          </Button>
        </Link>
      </div>
    </div>
  )
}
