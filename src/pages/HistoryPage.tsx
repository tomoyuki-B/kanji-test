import { useNavigate } from 'react-router-dom'

// TODO: IndexedDB から実績データを読み込む
const MOCK_HISTORY = {
  totalCorrectRate: 72,
  streak: 5,
  weak: ['複雑', '批判', '討論', '否定'],
}

export default function HistoryPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-purple-50 flex flex-col items-center p-6 gap-6">
      <h2 className="text-2xl font-bold text-purple-800 mt-4">成績</h2>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
        <div className="flex justify-around">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-purple-600">{MOCK_HISTORY.totalCorrectRate}%</span>
            <span className="text-gray-500">累計正答率</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-orange-500">{MOCK_HISTORY.streak}日</span>
            <span className="text-gray-500">連続学習</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-lg bg-red-50 rounded-2xl shadow p-6 flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-red-700">苦手な漢字</h3>
        <div className="flex flex-wrap gap-2">
          {MOCK_HISTORY.weak.map((k) => (
            <span key={k} className="px-3 py-1 bg-red-100 rounded-full text-red-800 text-xl font-bold">
              {k}
            </span>
          ))}
        </div>
        <button className="mt-2 py-3 bg-red-500 hover:bg-red-600 text-white text-xl font-bold rounded-xl">
          苦手だけ復習する
        </button>
      </div>

      <button
        onClick={() => navigate('/')}
        className="w-full max-w-lg py-4 bg-purple-500 hover:bg-purple-600 text-white text-2xl font-bold rounded-2xl"
      >
        ホームへ
      </button>
    </div>
  )
}
