import { Send } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useErinnerungSenden } from '../hooks/useChecklisten'

interface ErinnerungSendenProps {
  checklisteId: string
}

export function ErinnerungSenden({ checklisteId }: ErinnerungSendenProps) {
  const senden = useErinnerungSenden()

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1"
      onClick={() => senden.mutate({ checklisteId, typ: 'manuell' })}
      disabled={senden.isPending}
    >
      <Send className="h-3 w-3" />
      {senden.isPending ? 'Wird gesendet...' : senden.isSuccess ? 'Gesendet!' : 'E-Mail senden'}
    </Button>
  )
}
