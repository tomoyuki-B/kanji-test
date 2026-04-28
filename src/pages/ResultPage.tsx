import { useNavigate } from 'react-router-dom'

// TODO: 実際のテスト結果を受け取る
const MOCK_SUMMARY = {
  total: 10,
  correct: 7,
  weak: ['興奮', '複雑', '批判'],
}

export default function ResultPage() {
  const navigate = useNavigate()
  const rate = Math.round((MOCK_SUMMARY.correct / MOCK_SUMMARY.total) * 100)

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center p-6 gap-6">
      <h2 className="text-2xl font-bold text-amber-800 mt-4">テスト結果</h2>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4">
        <p className="text-6xl font-bold text-amber-600">{rate}点</p>
        <p className="text-gray-600 text-lg">
          {MOCK_SUMMARY.total}問中 {MOCK_SUMMARY.correct}問正解
        </p>
      </div>

      {MOCK_SUMMARY.weak.length > 0 && (
        <div className="w-full max-w-lg bg-red-50 rounded-2xl shadow p-6 flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-red-700">苦手な漢字</h3>
          <div className="flex flex-wrap gap-2">
            {MOCK_SUMMARY.weak.map((k) => (
              <span key={k} className="px-3 py-1 bg-red-100 rounded-full text-red-800 text-xl font-bold">
                {k}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-lg">
        <button
          onClick={() => navigate('/')}
          className="py-4 bg-amber-500 hover:bg-amber-600 text-white text-2xl font-bold rounded-2xl"
        >
          もう一度
        </button>
        <button
          onClick={() => navigate('/history')}
          className="py-4 bg-white border border-amber-400 text-amber-700 text-xl font-semibold rounded-2xl"
        >
          成績を見る
        </button>
      </div>
    </div>
  )
}
