import { useRef, useState } from 'react'
import { FileText, Upload, Trash2, ExternalLink, Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { supabase } from '@/shared/lib/supabase'
import { useKanzlei } from '@/features/dashboard/hooks/useDashboard'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/hooks/useToast'

interface VorlageEintrag {
  key: string
  label: string
  beschreibung: string
  dbFeld: 'vollmacht_vorlage_url' | 'datenschutz_vorlage_url'
  storageName: string
}

const VORLAGEN: VorlageEintrag[] = [
  {
    key: 'vollmacht',
    label: 'Vollmacht',
    beschreibung: 'Wird dem Mandanten im Portal zur digitalen Unterschrift vorgelegt.',
    dbFeld: 'vollmacht_vorlage_url',
    storageName: 'vollmacht.pdf',
  },
  {
    key: 'datenschutz',
    label: 'Datenschutzerklärung',
    beschreibung: 'DSGVO-konforme Einwilligung zur Datenverarbeitung. Wird digital unterschrieben.',
    dbFeld: 'datenschutz_vorlage_url',
    storageName: 'datenschutz.pdf',
  },
]

export function VorlagenPage() {
  const { data: kanzlei, isLoading } = useKanzlei()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!kanzlei) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vorlagen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          PDF-Vorlagen die Ihren Mandanten im Portal zum Lesen und Unterschreiben angezeigt werden.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {VORLAGEN.map((vorlage) => (
          <VorlageKarte
            key={vorlage.key}
            vorlage={vorlage}
            kanzleiId={kanzlei.id}
            aktuelleUrl={(kanzlei[vorlage.dbFeld] as string | null) ?? null}
          />
        ))}
      </div>

      {/* Hinweis */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4 text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">So funktioniert es:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Laden Sie Ihre Vollmacht und Datenschutzerklärung als PDF hoch.</li>
            <li>Wenn Sie eine GwG-Checkliste für einen Mandanten erstellen, werden diese PDFs automatisch eingebunden.</li>
            <li>Der Mandant sieht die PDFs im Portal, kann sie lesen und digital unterschreiben.</li>
            <li>Das unterschriebene PDF wird automatisch in der Checkliste gespeichert.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

interface VorlageKarteProps {
  vorlage: VorlageEintrag
  kanzleiId: string
  aktuelleUrl: string | null
}

function VorlageKarte({ vorlage, kanzleiId, aktuelleUrl }: VorlageKarteProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const storagePfad = `${kanzleiId}/${vorlage.storageName}`

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0]
    if (!datei) return

    if (datei.type !== 'application/pdf') {
      toast({ titel: 'Nur PDF-Dateien erlaubt', variante: 'destructive' })
      return
    }

    if (datei.size > 5 * 1024 * 1024) {
      toast({ titel: 'Datei zu groß (max. 5 MB)', variante: 'destructive' })
      return
    }

    setIsUploading(true)
    try {
      await supabase.storage.from('vorlagen').remove([storagePfad])
      const { error: uploadError } = await supabase.storage
        .from('vorlagen')
        .upload(storagePfad, datei, { upsert: true })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('vorlagen')
        .getPublicUrl(storagePfad)

      const { error: updateError } = await supabase
        .from('kanzleien')
        .update({ [vorlage.dbFeld]: urlData.publicUrl })
        .eq('id', kanzleiId)
      if (updateError) throw updateError

      queryClient.invalidateQueries({ queryKey: ['kanzlei'] })
      toast({ titel: `${vorlage.label} hochgeladen` })
    } catch {
      toast({ titel: 'Upload fehlgeschlagen', variante: 'destructive' })
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleEntfernen = async () => {
    setIsUploading(true)
    try {
      await supabase.storage.from('vorlagen').remove([storagePfad])
      const { error } = await supabase
        .from('kanzleien')
        .update({ [vorlage.dbFeld]: null })
        .eq('id', kanzleiId)
      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['kanzlei'] })
      toast({ titel: `${vorlage.label} entfernt` })
    } catch {
      toast({ titel: 'Entfernen fehlgeschlagen', variante: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          {vorlage.label}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{vorlage.beschreibung}</p>
      </CardHeader>
      <CardContent>
        {aktuelleUrl ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-ampel-gruen" />
                <span>{vorlage.storageName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <a href={aktuelleUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleEntfernen} disabled={isUploading}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              PDF ersetzen
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-24 border-dashed flex flex-col gap-2"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm">
              {isUploading ? 'Wird hochgeladen...' : 'PDF hochladen'}
            </span>
          </Button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleUpload}
          className="hidden"
        />
      </CardContent>
    </Card>
  )
}
