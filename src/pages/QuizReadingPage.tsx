import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DrawingCanvas from '../components/DrawingCanvas'
import KanaKeyboard from '../components/KanaKeyboard'

const MOCK_QUESTION = {
  id: 'g5-001',
  kanji: '興奮',
  reading: 'こうふん',
  example: 'この本は{}する内容だ。',
}

export default function QuizReadingPage() {
  const navigate = useNavigate()
  const [useKeyboard, setUseKeyboard] = useState(false)
  const [kanaInput, setKanaInput] = useState('')
  const chars = MOCK_QUESTION.reading.split('')

  const handleNext = () => {
    navigate('/grading', { state: { questionId: MOCK_QUESTION.id } })
  }

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center p-6 gap-6">
      <h2 className="text-2xl font-bold text-green-800 mt-4">読み方</h2>

      {/* 出題漢字 */}
      <p className="text-5xl font-bold text-gray-800 bg-white rounded-xl px-8 py-4 shadow">
        {MOCK_QUESTION.kanji}
      </p>

      {/* 入力切り替えトグル */}
      <button
        onClick={() => setUseKeyboard((v) => !v)}
        className="px-4 py-2 bg-white border border-green-400 rounded-xl text-green-700 font-semibold"
      >
        {useKeyboard ? '手書きに切り替え' : '50音キーボードに切り替え'}
      </button>

      {useKeyboard ? (
        <KanaKeyboard value={kanaInput} onChange={setKanaInput} maxLength={chars.length} />
      ) : (
        <div className="flex gap-3">
          {chars.map((_, i) => (
            <DrawingCanvas key={i} size={120} label={`${i + 1}文字目`} />
          ))}
        </div>
      )}

      <button
        onClick={handleNext}
        className="mt-auto w-full max-w-lg py-4 bg-green-500 hover:bg-green-600 text-white text-2xl font-bold rounded-2xl"
      >
        採点する
      </button>
    </div>
  )
}
