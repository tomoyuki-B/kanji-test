import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react'
import { type RecognitionCandidate, type RawStroke } from '../lib/recognizer'

export interface DrawingCanvasHandle {
  clear: () => void
}

interface Props {
  size?: number
  label?: string
  readingHint?: string
  showClearButton?: boolean
  recognitionType?: 'kanji' | 'hiragana'
  gradeLimit?: 1 | 2 | 3 | 4 | 5 | 6
  onRecognized?: (results: RecognitionCandidate[]) => void
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  { size = 240, label, readingHint, showClearButton = true, recognitionType = 'kanji', gradeLimit, onRecognized },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPos = useRef<[number, number] | null>(null)
  const allStrokes = useRef<RawStroke[]>([])
  const currentStroke = useRef<RawStroke>([])
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [hasStrokes, setHasStrokes] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = '#1e293b'
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // passive: false にして preventDefault() を呼ばないと iOS の拡大鏡が止まらない
    const block = (e: TouchEvent) => e.preventDefault()
    canvas.addEventListener('touchstart', block, { passive: false })
    canvas.addEventListener('touchmove', block, { passive: false })
    return () => {
      canvas.removeEventListener('touchstart', block)
      canvas.removeEventListener('touchmove', block)
    }
  }, [])

  const handleClear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    allStrokes.current = []
    currentStroke.current = []
    lastPos.current = null
    setHasStrokes(false)
  }

  useImperativeHandle(ref, () => ({ clear: handleClear }))

  const clientToCanvas = (clientX: number, clientY: number): [number, number] => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return [
      (clientX - rect.left) * (canvas.width / rect.width),
      (clientY - rect.top) * (canvas.height / rect.height),
    ]
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    const [x, y] = clientToCanvas(e.clientX, e.clientY)
    lastPos.current = [x, y]
    currentStroke.current = [[x, y]]
    // 点だけ打たれた場合も見えるように小さい円を描く
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.beginPath()
    ctx.arc(x, y, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  const finishStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // drawing.current の状態に関わらず常にキャプチャを解放する
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (_) {}
    if (!drawing.current) return
    drawing.current = false
    lastPos.current = null
    if (currentStroke.current.length > 0) {
      allStrokes.current.push([...currentStroke.current])
      currentStroke.current = []
      setHasStrokes(true)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // buttons=0 はペン/指が離れた状態。この検知でキャプチャを確実に解放する
    if (e.buttons === 0) { finishStroke(e); return }
    if (!drawing.current || !lastPos.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    // getCoalescedEvents でフレーム間の中間点も全て取得（Apple Pencil 高精度化）
    const events: PointerEvent[] =
      (e.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? [e.nativeEvent as PointerEvent]

    for (const ev of events) {
      const [x, y] = clientToCanvas(ev.clientX, ev.clientY)
      ctx.beginPath()
      ctx.moveTo(lastPos.current[0], lastPos.current[1])
      ctx.lineTo(x, y)
      ctx.stroke()
      lastPos.current = [x, y]
      currentStroke.current.push([x, y])
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    finishStroke(e)
  }

  const handleRecognize = async () => {
    if (!onRecognized || allStrokes.current.length === 0 || isRecognizing) return
    setIsRecognizing(true)
    try {
      const { recognizeKanji, recognizeHiragana } = await import('../lib/recognizer')
      const results = recognitionType === 'hiragana'
        ? await recognizeHiragana(allStrokes.current)
        : await recognizeKanji(allStrokes.current, gradeLimit !== undefined ? { gradeLimit } : undefined)
      onRecognized(results)
    } finally {
      setIsRecognizing(false)
    }
  }

  return (
    <div
      className="flex flex-col items-center gap-2"
      style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' } as React.CSSProperties}
    >
      {label && <span className="text-xs text-gray-400">{label}</span>}
      <div
        className="border-2 border-gray-300 rounded-xl bg-white relative overflow-hidden"
        style={{ width: size, height: size, WebkitUserSelect: 'none', userSelect: 'none' } as React.CSSProperties}
        onContextMenu={(e) => e.preventDefault()}
      >
        <svg className="absolute inset-0 pointer-events-none" width={size} height={size}>
          <line x1={size / 2} y1={0} x2={size / 2} y2={size} stroke="#e2e8f0" strokeWidth={1} />
          <line x1={0} y1={size / 2} x2={size} y2={size / 2} stroke="#e2e8f0" strokeWidth={1} />
        </svg>
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          className="cursor-crosshair w-full h-full"
          style={{
            touchAction: 'none',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
        />
      </div>

      {readingHint && (
        <span className="text-gray-400" style={{ fontSize: '13px' }}>
          {readingHint}
        </span>
      )}

      <div className="flex gap-2">
        {showClearButton && (
          <button
            onClick={handleClear}
            style={{ touchAction: 'manipulation' }}
            className="min-h-[44px] px-4 text-sm text-gray-500 font-medium
              border border-gray-300 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-100"
          >
            消す
          </button>
        )}
        {onRecognized && (
          <button
            onClick={handleRecognize}
            disabled={isRecognizing || !hasStrokes}
            style={{ touchAction: 'manipulation' }}
            className="min-h-[44px] px-4 text-sm font-bold rounded-lg border-2 transition-colors
              disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-300
              enabled:border-violet-500 enabled:bg-violet-500 enabled:text-white enabled:hover:bg-violet-600"
          >
            {isRecognizing ? '認識中…' : '認識'}
          </button>
        )}
      </div>
    </div>
  )
})

export default DrawingCanvas
