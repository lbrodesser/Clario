import { useState } from 'react'
import { Input } from '@/shared/components/ui/input'
import { useWertSpeichern } from '../hooks/useUpload'

interface TextEingabeProps {
  dokumentId: string
  portalToken: string
  format: string | null
  placeholder: string | null
  aktuellerWert?: string | null
}

// IBAN formatieren: DE89 3704 0044 0532 0130 00
function formatIBAN(wert: string): string {
  const sauber = wert.replace(/\s/g, '').toUpperCase()
  return sauber.replace(/(.{4})/g, '$1 ').trim()
}

export function TextEingabe({ dokumentId, portalToken, format, placeholder, aktuellerWert }: TextEingabeProps) {
  const [wert, setWert] = useState(aktuellerWert ?? '')
  const speichern = useWertSpeichern()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let neuerWert = e.target.value
    if (format === 'IBAN') {
      neuerWert = formatIBAN(neuerWert)
    }
    setWert(neuerWert)
  }

  const handleBlur = () => {
    if (!wert.trim()) return
    speichern.mutate({ dokumentId, portalToken, text: wert })
  }

  return (
    <Input
      value={wert}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder ?? ''}
      className="h-12 text-[16px]"
    />
  )
}
