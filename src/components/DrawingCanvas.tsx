import { useRef, useEffect } from 'react'

interface Props {
  size?: number
  label?: string
  readingHint?: string
  onStrokeEnd?: (imageData: ImageData) => void
}

export default function DrawingCanvas({ size = 240, label, readingHint, onStrokeEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvasRef.current!.width / rect.width),
      y: (e.clientY - rect.top) * (canvasRef.current!.height / rect.height),
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const handlePointerUp = (_e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx && onStrokeEnd) {
      onStrokeEnd(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <span className="text-xs text-gray-400">{label}</span>}
      <div
        className="border-2 border-gray-300 rounded-xl bg-white relative overflow-hidden"
        style={{ width: size, height: size }}
      >
        {/* 十字ガイド線 */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={size}
          height={size}
        >
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
          className="cursor-crosshair w-full h-full"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* 読み仮名ヒント */}
      {readingHint && (
        <span className="text-gray-400" style={{ fontSize: '13px' }}>
          {readingHint}
        </span>
      )}

      {/* 消すボタン */}
      <button
        onClick={handleClear}
        className="min-h-[44px] min-w-[44px] px-4 text-sm text-gray-500 font-medium
          border border-gray-300 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-100"
      >
        消す
      </button>
    </div>
  )
}
