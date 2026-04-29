import { useEffect, useRef } from 'react'

interface Props {
  isCorrect: boolean
  kanji: string
  reading: string
  mode: 'writing' | 'reading'
  onNext: () => void
}

export default function ResultOverlay({ isCorrect, kanji, reading, mode, onNext }: Props) {
  const onNextRef = useRef(onNext)
  onNextRef.current = onNext

  useEffect(() => {
    const timer = setTimeout(() => onNextRef.current(), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: isCorrect ? 'rgba(22,163,74,0.92)' : 'rgba(220,38,38,0.92)' }}
      onClick={onNext}
    >
      <div className="flex flex-col items-center gap-4 text-white select-none">
        <span className="font-bold" style={{ fontSize: '100px', lineHeight: 1 }}>
          {isCorrect ? '○' : '✕'}
        </span>
        {isCorrect ? (
          <>
            <p className="text-4xl font-bold">正解！</p>
            <p className="text-2xl font-semibold">
              {kanji}
              <span className="text-xl ml-2">（{reading}）</span>
            </p>
          </>
        ) : (
          <>
            <p className="text-3xl font-bold">不正解…</p>
            <p className="text-2xl text-center">
              {mode === 'writing'
                ? <>正解は「{kanji}」<span className="text-xl">（{reading}）</span></>
                : <>正解は「{reading}」<span className="text-xl"> （{kanji}）</span></>
              }
            </p>
          </>
        )}
        <p className="text-sm mt-2" style={{ opacity: 0.7 }}>タップで次へ</p>
      </div>
    </div>
  )
}
