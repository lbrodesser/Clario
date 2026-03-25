import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useFreierUpload } from '../hooks/useUpload'

interface FreierUploadButtonProps {
  mandantId: string
  checklisteId: string
  portalToken: string
}

export function FreierUploadButton({ mandantId, checklisteId, portalToken }: FreierUploadButtonProps) {
  const [offen, setOffen] = useState(false)
  const [beschreibung, setBeschreibung] = useState('')
  const dateiRef = useRef<HTMLInputElement>(null)
  const freierUpload = useFreierUpload()

  const handleDatei = (e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0]
    if (!datei) return

    freierUpload.mutate(
      {
        mandantId,
        checklisteId,
        datei,
        beschreibung: beschreibung || undefined,
        portalToken,
      },
      {
        onSuccess: () => {
          setOffen(false)
          setBeschreibung('')
        },
      }
    )
  }

  if (!offen) {
    return (
      <Button
        variant="outline"
        className="w-full min-h-[48px] gap-2 text-[16px]"
        onClick={() => setOffen(true)}
      >
        <Plus className="h-5 w-5" />
        Weiteres Dokument hinzufuegen
      </Button>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="font-medium text-[16px]">Zusaetzliches Dokument hochladen</p>
      <Input
        value={beschreibung}
        onChange={(e) => setBeschreibung(e.target.value)}
        placeholder="Kurze Beschreibung (optional)"
        className="h-12 text-[16px]"
      />
      <input
        ref={dateiRef}
        type="file"
        className="hidden"
        onChange={handleDatei}
        accept=".pdf,.jpg,.jpeg,.png"
      />
      <div className="flex gap-2">
        <Button
          onClick={() => dateiRef.current?.click()}
          disabled={freierUpload.isPending}
          className="min-h-[48px]"
        >
          {freierUpload.isPending ? 'Wird hochgeladen...' : 'Datei waehlen'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setOffen(false)}
          className="min-h-[48px]"
        >
          Abbrechen
        </Button>
      </div>
    </div>
  )
}
