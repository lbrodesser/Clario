import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'

interface ChatNachricht {
  rolle: 'mandant' | 'assistent'
  text: string
  eskalation?: boolean
}

interface PortalChatProps {
  portalToken: string
  kanzleiName: string
}

export function PortalChat({ portalToken, kanzleiName }: PortalChatProps) {
  const [offen, setOffen] = useState(false)
  const [nachricht, setNachricht] = useState('')
  const [verlauf, setVerlauf] = useState<ChatNachricht[]>([
    {
      rolle: 'assistent',
      text: `Guten Tag! Ich bin der Assistent von ${kanzleiName}. Ich helfe Ihnen gerne bei Fragen zu Ihren Dokumenten. Wo kann ich helfen?`,
    },
  ])
  const scrollRef = useRef<HTMLDivElement>(null)

  const chat = useMutation({
    mutationFn: async (text: string) => {
      const { data, error } = await supabase.functions.invoke('ki-mandant-chat', {
        body: {
          nachricht: text,
          portalToken,
          verlauf: verlauf.map((v) => ({ rolle: v.rolle, text: v.text })),
        },
      })
      if (error) throw error
      return data as { antwort: string; eskalation: boolean }
    },
  })

  const handleSenden = () => {
    const text = nachricht.trim()
    if (!text || chat.isPending) return

    setNachricht('')
    setVerlauf((prev) => [...prev, { rolle: 'mandant', text }])

    chat.mutate(text, {
      onSuccess: (data) => {
        setVerlauf((prev) => [
          ...prev,
          { rolle: 'assistent', text: data.antwort, eskalation: data.eskalation },
        ])
      },
      onError: () => {
        setVerlauf((prev) => [
          ...prev,
          { rolle: 'assistent', text: 'Es tut mir leid, ich konnte Ihre Anfrage gerade nicht verarbeiten. Bitte versuchen Sie es erneut.' },
        ])
      },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSenden()
    }
  }

  // Auto-Scroll bei neuen Nachrichten
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [verlauf])

  // Chat-Bubble (geschlossen)
  if (!offen) {
    return (
      <button
        onClick={() => setOffen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Chat öffnen"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    )
  }

  // Chat-Fenster (geöffnet)
  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-[340px] max-h-[500px] flex-col rounded-2xl border bg-background shadow-2xl sm:w-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Hilfe & Rückfragen</span>
        </div>
        <button onClick={() => setOffen(false)} className="hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nachrichten */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[340px]">
        {verlauf.map((msg, i) => (
          <div key={i} className={`flex ${msg.rolle === 'mandant' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                msg.rolle === 'mandant'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted rounded-bl-md'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.eskalation && (
                <div className="flex items-center gap-1 mt-2 text-xs opacity-80">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Wird an Ihre Kanzlei weitergeleitet</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {chat.isPending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Eingabe */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <textarea
            value={nachricht}
            onChange={(e) => setNachricht(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ihre Frage..."
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm resize-none min-h-[40px] max-h-[80px]"
            rows={1}
          />
          <Button
            size="sm"
            onClick={handleSenden}
            disabled={!nachricht.trim() || chat.isPending}
            className="h-10 w-10 shrink-0 rounded-lg p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground text-center">
          KI-Assistent · Keine Rechtsberatung
        </p>
      </div>
    </div>
  )
}
