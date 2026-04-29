import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, getWeakKanji, getDailyStats, type Stats, type WeakKanji, type DailyStat } from '../lib/db'

const ACCENT = '#534AB7'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [weakKanji, setWeakKanji] = useState<WeakKanji[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStats(), getWeakKanji(20), getDailyStats()])
      .then(([s, w, d]) => {
        setStats(s)
        setWeakKanji(w)
        setDailyStats(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <p className="text-gray-500 text-xl">読み込み中...</p>
      </div>
    )
  }

  const maxRate = Math.max(...dailyStats.map((d) => d.correctRate ?? 0), 1)

  return (
    <div className="min-h-screen bg-purple-50 flex flex-col items-center p-6 gap-6 pb-12">
      <header
        className="w-full flex items-center justify-center py-4"
        style={{ background: ACCENT, borderRadius: '0 0 16px 16px', margin: '-24px -24px 0' }}
      >
        <h1 className="text-2xl font-bold text-white">成績</h1>
      </header>

      {/* サマリーカード3つ */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-lg mt-4">
        <SummaryCard
          label="累計正答率"
          value={stats?.todayCorrectRate != null ? `${stats.todayCorrectRate}%` : '−'}
          color="text-violet-700"
        />
        <SummaryCard
          label="連続学習"
          value={stats ? `${stats.streak}日` : '−'}
          color="text-orange-500"
        />
        <SummaryCard
          label="解いた問題"
          value={stats ? `${stats.totalQuestions}問` : '−'}
          color="text-sky-600"
        />
      </div>

      {/* 直近7日間グラフ */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow p-5 flex flex-col gap-3">
        <h3 className="text-base font-bold text-gray-500">直近7日間の正答率</h3>
        <div className="flex items-end gap-2 h-28">
          {dailyStats.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold" style={{ color: ACCENT }}>
                {d.correctRate != null ? `${d.correctRate}%` : ''}
              </span>
              <div className="w-full flex items-end" style={{ height: '60px' }}>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: d.correctRate != null ? `${(d.correctRate / maxRate) * 60}px` : '4px',
                    background: d.correctRate != null ? ACCENT : '#e2e8f0',
                    minHeight: '4px',
                  }}
                />
              </div>
              <span className="text-xs text-gray-400">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 苦手な漢字一覧 */}
      {weakKanji.length > 0 && (
        <div className="w-full max-w-lg bg-white rounded-2xl shadow p-5 flex flex-col gap-3">
          <h3 className="text-base font-bold text-gray-500">苦手な漢字</h3>
          <div className="flex flex-col gap-2">
            {weakKanji.map((w) => (
              <div
                key={w.questionId}
                className="flex items-center justify-between px-4 py-3 bg-red-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-900">{w.kanji}</span>
                  <span className="text-gray-500 text-base">（{w.reading}）</span>
                </div>
                <span className="text-red-600 text-sm font-semibold">
                  {w.mistakeCount}回まちがい
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {weakKanji.length === 0 && !loading && (
        <div className="w-full max-w-lg bg-green-50 rounded-2xl shadow p-5 text-center">
          <p className="text-green-700 text-base">まちがいはまだありません</p>
        </div>
      )}

      <button
        onClick={() => navigate('/')}
        className="w-full max-w-lg py-4 text-white text-xl font-bold rounded-2xl"
        style={{ background: ACCENT }}
      >
        ホームへもどる
      </button>
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center py-4 px-2 gap-1">
      <span className={`font-bold ${color}`} style={{ fontSize: '26px' }}>
        {value}
      </span>
      <span className="text-gray-400 text-xs text-center leading-tight">{label}</span>
    </div>
  )
}
