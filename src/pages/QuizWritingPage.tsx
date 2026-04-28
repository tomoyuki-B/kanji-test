import { useNavigate } from 'react-router-dom'
import DrawingCanvas from '../components/DrawingCanvas'

// TODO: 実際の問題データをルートの state / context から受け取る
const MOCK_QUESTION = {
  id: 'g5-001',
  example: 'この本は{}する内容だ。',
  kanji: '興奮',
  reading: 'こうふん',
}

/**
 * 読み仮名を漢字の文字数で均等に分割する。
 * 例: kanji="興奮"(2文字), reading="こうふん"(4文字) → ["こう", "ふん"]
 * 余りが出る場合は最後のマスに入れる。
 */
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

  const handleNext = () => {
    navigate('/grading', { state: { questionId: MOCK_QUESTION.id } })
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center p-6 gap-6">
      <h2 className="text-2xl font-bold text-blue-800 mt-4">書き取り</h2>

      {/* 例文 */}
      <p className="text-xl text-gray-700 bg-white rounded-xl px-6 py-4 shadow w-full max-w-2xl text-center">
        {MOCK_QUESTION.example.split('{}').map((part, i, arr) => (
          <span key={i}>
            {part}
            {i < arr.length - 1 && (
              <span className="text-red-500 font-bold">{MOCK_QUESTION.reading}</span>
            )}
          </span>
        ))}
      </p>

      {/* 解答マス — 狭い画面では折り返す */}
      <div className="flex flex-wrap justify-center gap-4">
        {chars.map((_, i) => (
          <DrawingCanvas
            key={i}
            size={240}
            readingHint={readingHints[i]}
          />
        ))}
      </div>

      <button
        onClick={handleNext}
        className="w-full max-w-2xl py-4 bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold rounded-2xl"
      >
        採点する
      </button>
    </div>
  )
}
