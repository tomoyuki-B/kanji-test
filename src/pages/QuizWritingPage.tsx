import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DrawingCanvas, { type DrawingCanvasHandle } from '../components/DrawingCanvas'
import { type RecognitionCandidate } from '../lib/recognizer'

const ACCENT = '#534AB7'

// TODO: 実際の問題データをルートの state / context から受け取る
const MOCK_QUESTION = {
  id: 'g5-001',
  grade: 5 as const,
  unit: '国語上 第1単元',
  kanji: '興奮',
  reading: 'こうふん',
  type: 'jukugo' as const,
  example: 'この本は{}する内容だ。',
  meaning: '気持ちが高ぶること',
}

function splitReading(kanji: string, reading: string): string[] {
  const kanjiLen = kanji.length
  if (kanjiLen === 1) return [reading]
  const kanaChars = [...reading]
  const base = Math.floor(kanaChars.length / kanjiLen)
  const remainder = kanaChars.length % kanjiLen
  return Array.from({ length: kanjiLen }, (_, i) => {
    const start = i * base + Math.min(i, remainder)
    const len = base + (i < remainder ? 1 : 0)
    return kanaChars.slice(start, start + len).join('')
  })
}

export default function QuizWritingPage() {
  const navigate = useNavigate()
  const chars = MOCK_QUESTION.kanji.split('')
  const readingHints = splitReading(MOCK_QUESTION.kanji, MOCK_QUESTION.reading)

  const [recognizedChars, setRecognizedChars] = useState<(string | null)[]>(
    () => new Array(chars.length).fill(null),
  )
  const [candidatesPerSlot, setCandidatesPerSlot] = useState<RecognitionCandidate[][]>(
    () => new Array(chars.length).fill([]),
  )

  const canvasRefs = useRef<(DrawingCanvasHandle | null)[]>([])

  const handleRecognized = (slotIndex: number) => (results: RecognitionCandidate[]) => {
    if (results.length === 0) return
    setRecognizedChars((prev) => {
      const next = [...prev]
      next[slotIndex] = results[0].char
      return next
    })
    setCandidatesPerSlot((prev) => {
      const next = [...prev]
      next[slotIndex] = results.slice(1)
      return next
    })
  }

  const handleSelectCandidate = (slotIndex: number, char: string) => {
    setRecognizedChars((prev) => {
      const next = [...prev]
      next[slotIndex] = char
      return next
    })
    // 選んだ候補を先頭から除く
    setCandidatesPerSlot((prev) => {
      const next = [...prev]
      next[slotIndex] = next[slotIndex].filter((c) => c.char !== char)
      return next
    })
  }

  const allFilled = recognizedChars.every((c) => c !== null)
  const userAnswer = recognizedChars.join('')
  const correct = userAnswer === MOCK_QUESTION.kanji

  const handleAnswer = () => {
    navigate('/grading', {
      state: {
        question: MOCK_QUESTION,
        userAnswer,
        correct,
      },
    })
  }

  const exampleParts = MOCK_QUESTION.example.split('{}')

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center p-5 gap-5">
      <h2 className="text-2xl font-bold mt-4" style={{ color: ACCENT }}>書き取り</h2>

      {/* 例文 */}
      <p className="text-xl text-gray-700 bg-white rounded-xl px-6 py-4 shadow w-full max-w-2xl text-center">
        {exampleParts[0]}
        <span className="text-red-500 font-bold">{MOCK_QUESTION.reading}</span>
        {exampleParts[1]}
      </p>

      {/* 解答スロット */}
      <div className="flex flex-wrap justify-center gap-6">
        {chars.map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            {/* 認識結果表示 */}
            <div
              className="w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-bold bg-white"
              style={{ borderColor: recognizedChars[i] ? ACCENT : '#e2e8f0' }}
            >
              {recognizedChars[i] ?? ''}
            </div>

            {/* 候補ボタン（2nd/3rd） */}
            {candidatesPerSlot[i].length > 0 && (
              <div className="flex gap-1">
                {candidatesPerSlot[i].map((c) => (
                  <button
                    key={c.char}
                    onClick={() => handleSelectCandidate(i, c.char)}
                    className="w-10 h-10 bg-violet-50 border border-violet-300 rounded-lg text-lg font-bold text-violet-700"
                  >
                    {c.char}
                  </button>
                ))}
              </div>
            )}

            {/* 手書きキャンバス */}
            <DrawingCanvas
              ref={(el) => { canvasRefs.current[i] = el }}
              size={240}
              readingHint={readingHints[i]}
              recognitionType="kanji"
              onRecognized={handleRecognized(i)}
            />
          </div>
        ))}
      </div>

      {/* こたえるボタン */}
      <button
        onClick={handleAnswer}
        disabled={!allFilled}
        className="w-full max-w-2xl py-5 rounded-2xl text-white text-2xl font-bold"
        style={{
          background: allFilled ? ACCENT : '#a5b4fc',
          cursor: allFilled ? 'pointer' : 'not-allowed',
        }}
      >
        こたえる
      </button>
    </div>
  )
}
