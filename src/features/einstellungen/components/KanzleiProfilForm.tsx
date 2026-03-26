import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, Trash2, ExternalLink, Upload } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { toast } from '@/shared/hooks/useToast'
import type { Kanzlei } from '@/shared/types'

const profilSchema = z.object({
  name: z.string().min(2, 'Kanzleiname erforderlich'),
})

type ProfilFormDaten = z.infer<typeof profilSchema>

interface KanzleiProfilFormProps {
  kanzlei: Kanzlei
}

type VorlageTyp = 'vollmacht' | 'datenschutz'

export function KanzleiProfilForm({ kanzlei }: KanzleiProfilFormProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<ProfilFormDaten>({
    resolver: zodResolver(profilSchema),
    defaultValues: { name: kanzlei.name },
  })

  const aktualisieren = useMutation({
    mutationFn: async (daten: ProfilFormDaten) => {
      const { error } = await supabase
        .from('kanzleien')
        .update(daten)
        .eq('id', kanzlei.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanzlei'] })
    },
  })

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit((d) => aktualisieren.mutate(d))} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Kanzleiname</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <Button type="submit" disabled={aktualisieren.isPending}>
          {aktualisieren.isPending ? 'Wird gespeichert...' : 'Speichern'}
        </Button>
      </form>

      {/* GwG-Dokumentvorlagen */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">GwG-Dokumentvorlagen</h3>
          <p className="text-sm text-muted-foreground">
            Diese PDFs werden Ihren Mandanten im Portal zum Unterschreiben angezeigt. Laden Sie Ihre eigene Vorlage als PDF hoch.
          </p>
        </div>

        <VorlageUpload
          kanzleiId={kanzlei.id}
          typ="vollmacht"
          label="Vollmacht-Vorlage"
          aktuelleUrl={kanzlei.vollmacht_vorlage_url ?? null}
        />

        <VorlageUpload
          kanzleiId={kanzlei.id}
          typ="datenschutz"
          label="Datenschutzerklaerung-Vorlage"
          aktuelleUrl={kanzlei.datenschutz_vorlage_url ?? null}
        />
      </div>
    </div>
  )
}

interface VorlageUploadProps {
  kanzleiId: string
  typ: VorlageTyp
  label: string
  aktuelleUrl: string | null
}

function VorlageUpload({ kanzleiId, typ, label, aktuelleUrl }: VorlageUploadProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const datenbankFeld = typ === 'vollmacht' ? 'vollmacht_vorlage_url' : 'datenschutz_vorlage_url'
  const storagePfad = `${kanzleiId}/${typ}.pdf`

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0]
    if (!datei) return

    if (datei.type !== 'application/pdf') {
      toast({ titel: 'Nur PDF-Dateien erlaubt', variante: 'destructive' })
      return
    }

    if (datei.size > 5 * 1024 * 1024) {
      toast({ titel: 'Datei zu gross (max. 5 MB)', variante: 'destructive' })
      return
    }

    setIsUploading(true)
    try {
      // Alte Datei loeschen falls vorhanden
      await supabase.storage.from('vorlagen').remove([storagePfad])

      // Neue Datei hochladen
      const { error: uploadError } = await supabase.storage
        .from('vorlagen')
        .upload(storagePfad, datei, { upsert: true })

      if (uploadError) throw uploadError

      // Public URL holen
      const { data: urlData } = supabase.storage
        .from('vorlagen')
        .getPublicUrl(storagePfad)

      // URL in Kanzlei speichern
      const { error: updateError } = await supabase
        .from('kanzleien')
        .update({ [datenbankFeld]: urlData.publicUrl })
        .eq('id', kanzleiId)

      if (updateError) throw updateError

      queryClient.invalidateQueries({ queryKey: ['kanzlei'] })
      toast({ titel: `${label} hochgeladen` })
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
        .update({ [datenbankFeld]: null })
        .eq('id', kanzleiId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['kanzlei'] })
      toast({ titel: `${label} entfernt` })
    } catch {
      toast({ titel: 'Entfernen fehlgeschlagen', variante: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <Label>{label}</Label>

      {aktuelleUrl ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{typ}.pdf</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <a href={aktuelleUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              Ersetzen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEntfernen}
              disabled={isUploading}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Wird hochgeladen...' : 'PDF hochladen'}
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  )
}
