import { useNavigate, useLocation } from 'react-router-dom'
import { type KanjiQuestion } from '../lib/kanjiLoader'

interface GradingState {
  question: KanjiQuestion
  userAnswer: string
  correct: boolean
}

export default function GradingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as GradingState | null

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">採点データがありません</p>
      </div>
    )
  }

  const { question, userAnswer, correct } = state
  const exampleFilled = question.example.replace('{}', question.kanji)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 gap-6">
      <h2 className="text-2xl font-bold text-gray-800 mt-4">採点</h2>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className={`text-5xl ${correct ? 'text-green-500' : 'text-red-500'}`}>
            {correct ? '○' : '✕'}
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">正解</span>
              <span className="text-3xl font-bold text-gray-800">{question.kanji}</span>
            </div>
            {!correct && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">あなた</span>
                <span className="text-3xl font-bold text-red-400">{userAnswer}</span>
              </div>
            )}
          </div>
        </div>

        <hr />

        <p className="text-gray-700">
          <span className="font-semibold">読み：</span>
          {question.reading}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">意味：</span>
          {question.meaning}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">例文：</span>
          {exampleFilled}
        </p>
      </div>

      <button
        onClick={() => navigate('/quiz/writing')}
        className="w-full max-w-lg py-4 bg-amber-500 hover:bg-amber-600 text-white text-2xl font-bold rounded-2xl"
      >
        次の問題
      </button>

      <button
        onClick={() => navigate('/result')}
        className="text-gray-500 underline text-lg"
      >
        結果を見る（テスト終了）
      </button>
    </div>
  )
}
