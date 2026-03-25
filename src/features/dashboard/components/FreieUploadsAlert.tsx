import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'

interface FreieUploadsAlertProps {
  anzahl: number
}

export function FreieUploadsAlert({ anzahl }: FreieUploadsAlertProps) {
  if (anzahl === 0) return null

  return (
    <Card className="border-ampel-gelb">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-ampel-gelb" />
          <span className="text-sm font-medium">
            {anzahl} {anzahl === 1 ? 'Mandant hat' : 'Mandanten haben'} unaufgefordert Dokumente geschickt
          </span>
        </div>
        <Link to="/app/dokumente?filter=freie_uploads">
          <Button variant="outline" size="sm">Ansehen</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
