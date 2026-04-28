import { useNavigate } from 'react-router-dom'

// TODO: 実際の認識結果・正解データを受け取る
const MOCK_RESULT = {
  question: '興奮',
  answer: '興奮',
  correct: true,
  meaning: '気持ちが高ぶること',
  example: 'この本は興奮する内容だ。',
}

export default function GradingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 gap-6">
      <h2 className="text-2xl font-bold text-gray-800 mt-4">採点</h2>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className={`text-4xl ${MOCK_RESULT.correct ? 'text-green-500' : 'text-red-500'}`}>
            {MOCK_RESULT.correct ? '○' : '✕'}
          </span>
          <div>
            <p className="text-3xl font-bold text-gray-800">{MOCK_RESULT.question}</p>
            {!MOCK_RESULT.correct && (
              <p className="text-lg text-gray-500">あなたの答え: {MOCK_RESULT.answer}</p>
            )}
          </div>
        </div>

        <hr />

        <p className="text-gray-700">
          <span className="font-semibold">意味：</span>
          {MOCK_RESULT.meaning}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">例文：</span>
          {MOCK_RESULT.example}
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
