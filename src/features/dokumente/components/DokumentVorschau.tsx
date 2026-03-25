import type { DokumentDatei } from '@/shared/types'

interface DokumentVorschauProps {
  datei: DokumentDatei
}

export function DokumentVorschau({ datei }: DokumentVorschauProps) {
  const istBild = datei.dateityp?.startsWith('image/')

  if (istBild) {
    return (
      <img
        src={datei.datei_url}
        alt={datei.dateiname}
        className="max-h-64 rounded-lg object-contain"
      />
    )
  }

  return (
    <div className="flex items-center justify-center rounded-lg bg-muted p-8">
      <p className="text-sm text-muted-foreground">{datei.dateiname}</p>
    </div>
  )
}
