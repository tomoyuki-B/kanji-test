import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Grade = 5 | 6
type QuizType = 'writing' | 'reading'

export default function HomePage() {
  const navigate = useNavigate()
  const [grade, setGrade] = useState<Grade>(5)
  const [quizType, setQuizType] = useState<QuizType>('writing')

  const handleStart = () => {
    navigate(`/quiz/${quizType}`, { state: { grade } })
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6 gap-8">
      <h1 className="text-4xl font-bold text-amber-800">漢字テスト</h1>

      <section className="w-full max-w-sm bg-white rounded-2xl shadow p-6 flex flex-col gap-6">
        {/* 学年選択 */}
        <div className="flex flex-col gap-2">
          <span className="text-lg font-semibold text-gray-700">学年</span>
          <div className="flex gap-3">
            {([5, 6] as Grade[]).map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`flex-1 py-3 rounded-xl text-xl font-bold transition-colors
                  ${grade === g
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-amber-100'
                  }`}
              >
                {g}年生
              </button>
            ))}
          </div>
        </div>

        {/* 出題タイプ選択 */}
        <div className="flex flex-col gap-2">
          <span className="text-lg font-semibold text-gray-700">種類</span>
          <div className="flex gap-3">
            <button
              onClick={() => setQuizType('writing')}
              className={`flex-1 py-3 rounded-xl text-xl font-bold transition-colors
                ${quizType === 'writing'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
                }`}
            >
              書き取り
            </button>
            <button
              onClick={() => setQuizType('reading')}
              className={`flex-1 py-3 rounded-xl text-xl font-bold transition-colors
                ${quizType === 'reading'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                }`}
            >
              読み
            </button>
          </div>
        </div>

        {/* テスト開始ボタン */}
        <button
          onClick={handleStart}
          className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white text-2xl font-bold rounded-2xl transition-colors"
        >
          テスト開始
        </button>
      </section>

      {/* 成績画面へのリンク */}
      <button
        onClick={() => navigate('/history')}
        className="text-amber-700 underline text-lg"
      >
        成績を見る
      </button>
    </div>
  )
}
