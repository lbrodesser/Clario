import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  titel: string
  beschreibung?: string
  variante?: 'default' | 'destructive' | 'success'
}

let toastListener: ((toast: Toast) => void) | null = null

export function toast(params: Omit<Toast, 'id'>) {
  const id = crypto.randomUUID()
  toastListener?.({ ...params, id })
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((t: Toast) => {
    setToasts((prev) => [...prev, t])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id))
    }, 4000)
  }, [])

  toastListener = addToast

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, dismiss }
}
