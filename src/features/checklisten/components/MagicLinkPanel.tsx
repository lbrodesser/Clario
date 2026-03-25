import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

interface MagicLinkPanelProps {
  portalToken: string
}

export function MagicLinkPanel({ portalToken }: MagicLinkPanelProps) {
  const [kopiert, setKopiert] = useState(false)
  const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin
  const link = `${appUrl}/portal/${portalToken}`

  const handleKopieren = async () => {
    await navigator.clipboard.writeText(link)
    setKopiert(true)
    setTimeout(() => setKopiert(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <Input value={link} readOnly className="text-xs font-mono" />
      <Button variant="outline" size="sm" onClick={handleKopieren} className="gap-1 shrink-0">
        {kopiert ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {kopiert ? 'Kopiert' : 'Kopieren'}
      </Button>
    </div>
  )
}
