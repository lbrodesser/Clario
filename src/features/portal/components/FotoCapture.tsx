import { useRef } from 'react'
import { Camera, FileUp, Image } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface FotoCaptureProps {
  onDateiGewaehlt: (datei: File) => void
  xmlErlaubt?: boolean
}

export function FotoCapture({ onDateiGewaehlt, xmlErlaubt }: FotoCaptureProps) {
  const kameraRef = useRef<HTMLInputElement>(null)
  const dateiRef = useRef<HTMLInputElement>(null)
  const galerieRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0]
    if (datei) onDateiGewaehlt(datei)
    e.target.value = ''
  }

  const dateiAccept = xmlErlaubt
    ? '.pdf,.jpg,.jpeg,.png,.xml'
    : '.pdf,.jpg,.jpeg,.png'

  return (
    <div className="grid grid-cols-3 gap-2">
      <input
        ref={kameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={dateiRef}
        type="file"
        accept={dateiAccept}
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={galerieRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      <Button
        variant="outline"
        className="flex flex-col gap-1 h-auto py-3 min-h-[48px] text-xs"
        onClick={() => kameraRef.current?.click()}
      >
        <Camera className="h-5 w-5" />
        Foto aufnehmen
      </Button>
      <Button
        variant="outline"
        className="flex flex-col gap-1 h-auto py-3 min-h-[48px] text-xs"
        onClick={() => dateiRef.current?.click()}
      >
        <FileUp className="h-5 w-5" />
        Datei waehlen
      </Button>
      <Button
        variant="outline"
        className="flex flex-col gap-1 h-auto py-3 min-h-[48px] text-xs"
        onClick={() => galerieRef.current?.click()}
      >
        <Image className="h-5 w-5" />
        Galerie
      </Button>
    </div>
  )
}
