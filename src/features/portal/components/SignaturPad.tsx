import { useRef, useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'

interface SignaturPadProps {
  onSignieren: (signaturDataUrl: string) => void
  isLoading?: boolean
}

const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 200

export function SignaturPad({ onSignieren, isLoading }: SignaturPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // HiDPI-Skalierung: Canvas intern groesser rendern
    const dpr = window.devicePixelRatio || 1
    canvas.width = CANVAS_WIDTH * dpr
    canvas.height = CANVAS_HEIGHT * dpr

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Skalierung fuer scharfe Darstellung
    ctx.scale(dpr, dpr)

    const setzeStilEinstellungen = () => {
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
    setzeStilEinstellungen()

    const getPosition = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect()

      if ('touches' in e) {
        const touch = e.touches[0]
        return {
          x: (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width),
          y: (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height),
        }
      }
      return {
        x: (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width),
        y: (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height),
      }
    }

    const handleStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      isDrawingRef.current = true
      const pos = getPosition(e)
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    }

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return
      e.preventDefault()
      const pos = getPosition(e)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      setHasDrawn(true)
    }

    const handleEnd = () => {
      isDrawingRef.current = false
    }

    canvas.addEventListener('mousedown', handleStart)
    canvas.addEventListener('mousemove', handleMove)
    canvas.addEventListener('mouseup', handleEnd)
    canvas.addEventListener('mouseleave', handleEnd)
    canvas.addEventListener('touchstart', handleStart, { passive: false })
    canvas.addEventListener('touchmove', handleMove, { passive: false })
    canvas.addEventListener('touchend', handleEnd)

    return () => {
      canvas.removeEventListener('mousedown', handleStart)
      canvas.removeEventListener('mousemove', handleMove)
      canvas.removeEventListener('mouseup', handleEnd)
      canvas.removeEventListener('mouseleave', handleEnd)
      canvas.removeEventListener('touchstart', handleStart)
      canvas.removeEventListener('touchmove', handleMove)
      canvas.removeEventListener('touchend', handleEnd)
    }
  }, [])

  const loeschen = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, CANVAS_WIDTH * dpr, CANVAS_HEIGHT * dpr)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    setHasDrawn(false)
  }

  const handleSignieren = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn) return
    const dataUrl = canvas.toDataURL('image/png')
    onSignieren(dataUrl)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Bitte unterschreiben Sie hier:</p>

      <canvas
        ref={canvasRef}
        className="w-full max-w-[640px] rounded-lg border border-slate-300 bg-white touch-none"
        style={{ width: '100%', maxWidth: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
      />

      <p className="text-xs text-muted-foreground">
        Mit Ihrer Unterschrift bestaetigen Sie, dass Sie das Dokument gelesen und akzeptiert haben.
      </p>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={loeschen}
          disabled={!hasDrawn || isLoading}
          className="min-h-[48px]"
        >
          Unterschrift loeschen
        </Button>
        <Button
          onClick={handleSignieren}
          disabled={!hasDrawn || isLoading}
          className="min-h-[48px] flex-1"
        >
          {isLoading ? 'Wird verarbeitet...' : 'Unterschreiben und absenden'}
        </Button>
      </div>
    </div>
  )
}
