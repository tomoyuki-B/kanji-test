import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, type Stats } from '../lib/db'
import { loadKanjiData } from '../lib/kanjiLoader'

type Grade = 5 | 6
type Mode = 'writing' | 'reading'
type RangeType = 'random' | 'unit' | 'weak'
type QuestionCount = 5 | 10 | 20

const ACCENT = '#534AB7'

export default function HomePage() {
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('writing')
  const [grade, setGrade] = useState<Grade>(5)
  const [rangeType, setRangeType] = useState<RangeType>('random')
  const [selectedUnit, setSelectedUnit] = useState<string>('')
  const [units, setUnits] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState<QuestionCount>(10)
  const [stats, setStats] = useState<Stats | null>(null)

  // サマリー取得
  useEffect(() => {
    getStats().then(setStats).catch(() => setStats(null))
  }, [])

  // 単元一覧を学年変更ごとに取得
  useEffect(() => {
    loadKanjiData(grade)
      .then((data) => {
        const unique = [...new Set(data.map((q) => q.unit))]
        setUnits(unique)
        setSelectedUnit(unique[0] ?? '')
      })
      .catch(() => setUnits([]))
  }, [grade])

  const handleStart = () => {
    navigate(`/quiz/${mode}`, {
      state: {
        mode,
        grade,
        range: { type: rangeType, unit: rangeType === 'unit' ? selectedUnit : undefined },
        questionCount,
      },
    })
  }

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center pb-10">
      {/* ヘッダー */}
      <header
        className="w-full flex items-center justify-center py-5 shadow-sm"
        style={{ background: ACCENT }}
      >
        <h1 className="text-3xl font-bold text-white tracking-wide">漢字テスト</h1>
      </header>

      <div className="w-full max-w-xl px-4 flex flex-col gap-5 mt-5">

        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard
            label="今日の正答率"
            value={stats?.todayCorrectRate != null ? `${stats.todayCorrectRate}%` : '−'}
          />
          <SummaryCard
            label="連続学習日数"
            value={stats ? `${stats.streak}日` : '−'}
          />
          <SummaryCard
            label="といた問題数"
            value={stats ? `${stats.totalQuestions}問` : '−'}
          />
        </div>

        {/* モード選択 */}
        <Section title="モード">
          <div className="grid grid-cols-2 gap-3">
            <ModeCard
              active={mode === 'writing'}
              onClick={() => setMode('writing')}
              icon="✏️"
              label="書き取り"
            />
            <ModeCard
              active={mode === 'reading'}
              onClick={() => setMode('reading')}
              icon="📖"
              label="読み"
            />
          </div>
        </Section>

        {/* 学年選択 */}
        <Section title="学年">
          <div className="flex gap-3">
            {([5, 6] as Grade[]).map((g) => (
              <ChoiceButton
                key={g}
                active={grade === g}
                onClick={() => setGrade(g)}
                label={`${g}年生`}
              />
            ))}
          </div>
        </Section>

        {/* 出題範囲 */}
        <Section title="出題範囲">
          <div className="flex flex-col gap-2">
            <RangeOption
              active={rangeType === 'random'}
              onClick={() => setRangeType('random')}
              label="ランダム"
              description="全範囲からランダムに出題"
            />
            <RangeOption
              active={rangeType === 'unit'}
              onClick={() => setRangeType('unit')}
              label="単元別"
              description="単元を選んで出題"
            />
            <RangeOption
              active={rangeType === 'weak'}
              onClick={() => {
                if (stats?.hasWeakData) setRangeType('weak')
              }}
              label="苦手な漢字のみ"
              description="まちがえた漢字だけ復習"
              disabled={!stats?.hasWeakData}
            />
          </div>

          {/* 単元展開 */}
          {rangeType === 'unit' && units.length > 0 && (
            <div className="mt-3 flex flex-col gap-2 pl-2">
              {units.map((u) => (
                <button
                  key={u}
                  onClick={() => setSelectedUnit(u)}
                  className={`min-h-[48px] text-left px-4 py-2 rounded-xl border text-base transition-colors
                    ${selectedUnit === u
                      ? 'border-violet-500 bg-violet-50 text-violet-800 font-semibold'
                      : 'border-gray-200 bg-white text-gray-700'
                    }`}
                >
                  {u}
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* 出題数 */}
        <Section title="出題数">
          <div className="flex gap-3">
            {([5, 10, 20] as QuestionCount[]).map((n) => (
              <ChoiceButton
                key={n}
                active={questionCount === n}
                onClick={() => setQuestionCount(n)}
                label={`${n}問`}
              />
            ))}
          </div>
        </Section>

        {/* テスト開始 */}
        <button
          onClick={handleStart}
          className="w-full py-5 rounded-2xl text-white text-2xl font-bold shadow-md active:opacity-90 transition-opacity mt-2"
          style={{ background: ACCENT }}
        >
          テスト開始
        </button>

        {/* 成績へのリンク */}
        <button
          onClick={() => navigate('/history')}
          className="text-center text-violet-600 underline text-base py-2"
        >
          成績を見る
        </button>
      </div>
    </div>
  )
}

// ---- 小コンポーネント ----

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center py-4 px-2 gap-1">
      <span className="font-bold text-gray-800" style={{ fontSize: '28px' }}>
        {value}
      </span>
      <span className="text-gray-400 text-xs text-center leading-tight">{label}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-bold text-gray-500 tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

function ModeCard({
  active, onClick, icon, label,
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[80px] rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-colors
        ${active
          ? 'border-violet-500 bg-violet-50 text-violet-800'
          : 'border-gray-200 bg-white text-gray-600'
        }`}
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-lg font-bold">{label}</span>
    </button>
  )
}

function ChoiceButton({
  active, onClick, label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-h-[48px] rounded-xl text-lg font-bold border-2 transition-colors
        ${active
          ? 'border-violet-500 bg-violet-100 text-violet-800'
          : 'border-gray-200 bg-white text-gray-600'
        }`}
    >
      {label}
    </button>
  )
}

function RangeOption({
  active, onClick, label, description, disabled = false,
}: {
  active: boolean
  onClick: () => void
  label: string
  description: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[56px] w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors
        ${disabled
          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
          : active
            ? 'border-violet-500 bg-violet-50'
            : 'border-gray-200 bg-white text-gray-700'
        }`}
    >
      {/* ラジオ風インジケーター */}
      <span
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
          ${disabled ? 'border-gray-300' : active ? 'border-violet-500' : 'border-gray-300'}`}
      >
        {active && !disabled && (
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
        )}
      </span>
      <span className="flex flex-col">
        <span className={`font-bold text-base ${disabled ? 'text-gray-300' : active ? 'text-violet-800' : 'text-gray-700'}`}>
          {label}
        </span>
        <span className={`text-xs ${disabled ? 'text-gray-300' : 'text-gray-400'}`}>
          {description}
        </span>
      </span>
    </button>
  )
}
