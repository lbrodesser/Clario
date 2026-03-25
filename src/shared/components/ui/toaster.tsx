import { X } from 'lucide-react'
import { useToast } from '@/shared/hooks/useToast'
import { cn } from '@/shared/lib/utils'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'rounded-lg border px-4 py-3 shadow-lg bg-background text-sm animate-in slide-in-from-bottom-2',
            t.variante === 'destructive' && 'border-destructive text-destructive',
            t.variante === 'success' && 'border-ampel-gruen text-ampel-gruen'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{t.titel}</p>
              {t.beschreibung && (
                <p className="mt-1 text-muted-foreground">{t.beschreibung}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
