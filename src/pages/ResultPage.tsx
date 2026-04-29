import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { saveAnswer, saveSession } from '../lib/db'
import { type ResultNavState } from '../lib/types'

const ACCENT = '#534AB7'

export default function ResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const data = location.state as ResultNavState | null
  const saved = useRef(false)

  useEffect(() => {
    if (!data || saved.current) return
    saved.current = true
    const sessionId = `session-${data.startedAt}`
    const finishedAt = Date.now()
    const correctCount = data.answers.filter((a) => a.isCorrect).length

    Promise.all([
      ...data.answers.map((a) =>
        saveAnswer({
          sessionId,
          questionId: a.questionId,
          kanji: a.kanji,
          reading: a.reading,
          userAnswer: a.userAnswer,
          isCorrect: a.isCorrect,
          mode: data.mode,
          timestamp: finishedAt,
        }),
      ),
      saveSession({
        sessionId,
        mode: data.mode,
        grade: data.grade,
        questionCount: data.questionCount,
        correctCount,
        startedAt: data.startedAt,
        finishedAt,
      }),
    ]).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600 text-xl">結果データがありません</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl text-white font-bold"
          style={{ background: ACCENT }}
        >
          ホームへ
        </button>
      </div>
    )
  }

  const correctCount = data.answers.filter((a) => a.isCorrect).length
  const total = data.answers.length
  const rate = total > 0 ? Math.round((correctCount / total) * 100) : 0
  const wrongAnswers = data.answers.filter((a) => !a.isCorrect)

  const circumference = 2 * Math.PI * 44
  const dashOffset = circumference * (1 - rate / 100)

  const handleRetry = () => {
    navigate(`/quiz/${data.mode}`, { state: data.quizState })
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center p-6 gap-6 pb-12">
      <h2 className="text-3xl font-bold text-amber-800 mt-4">テスト終了！</h2>

      {/* 正答率サークル */}
      <div className="bg-white rounded-2xl shadow px-8 py-6 flex flex-col items-center gap-3 w-full max-w-lg">
        <svg width={120} height={120} viewBox="0 0 100 100">
          <circle cx={50} cy={50} r={44} fill="none" stroke="#e2e8f0" strokeWidth={8} />
          <circle
            cx={50}
            cy={50}
            r={44}
            fill="none"
            stroke={rate >= 80 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444'}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 50 50)"
          />
          <text x={50} y={54} textAnchor="middle" fontSize={22} fontWeight="bold" fill="#1e293b">
            {rate}%
          </text>
        </svg>
        <p className="text-gray-600 text-lg">
          {total}問中 <span className="font-bold text-gray-900">{correctCount}問</span>正解
        </p>
      </div>

      {/* 間違えた問題一覧 */}
      {wrongAnswers.length > 0 && (
        <div className="w-full max-w-lg bg-white rounded-2xl shadow p-5 flex flex-col gap-3">
          <h3 className="text-lg font-bold text-red-700">まちがえた問題</h3>
          {wrongAnswers.map((a, i) => {
            const exampleFilled = a.example.replace('{}', a.kanji)
            return (
              <div key={i} className="border border-red-100 rounded-xl p-4 flex flex-col gap-1 bg-red-50">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-2xl font-bold text-gray-900">{a.kanji}</span>
                  <span className="text-gray-500">（{a.reading}）</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">あなた：</span>
                  <span className="text-red-600 font-bold">{a.userAnswer || '（未入力）'}</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{exampleFilled}</p>
                {a.meaning && (
                  <p className="text-sm text-gray-400">意味：{a.meaning}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {wrongAnswers.length === 0 && (
        <div className="w-full max-w-lg bg-green-50 rounded-2xl shadow p-5 text-center">
          <p className="text-green-700 text-xl font-bold">全問正解！すごい！</p>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-lg">
        <button
          onClick={handleRetry}
          className="py-5 rounded-2xl text-white text-2xl font-bold"
          style={{ background: ACCENT }}
        >
          もう一度
        </button>
        <button
          onClick={() => navigate('/')}
          className="py-4 bg-white border-2 text-xl font-semibold rounded-2xl"
          style={{ borderColor: ACCENT, color: ACCENT }}
        >
          ホームへもどる
        </button>
      </div>
    </div>
  )
}
