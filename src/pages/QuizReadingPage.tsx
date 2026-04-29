import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import DrawingCanvas, { type DrawingCanvasHandle } from '../components/DrawingCanvas'
import KanaKeyboard from '../components/KanaKeyboard'
import { loadKanjiData, type KanjiQuestion } from '../lib/kanjiLoader'
import { type RecognitionCandidate } from '../lib/recognizer'

const ACCENT = '#534AB7'

interface LocationState {
  grade: 5 | 6
  range: { type: 'random' | 'unit' | 'weak'; unit?: string }
  questionCount: 5 | 10 | 20
}

const FALLBACK_STATE: LocationState = { grade: 5, range: { type: 'random' }, questionCount: 10 }

export default function QuizReadingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const quizState: LocationState = (location.state as LocationState) ?? FALLBACK_STATE

  const [questions, setQuestions] = useState<KanjiQuestion[]>([])
  const [currentIndex] = useState(0)
  const [cells, setCells] = useState<string[]>([])
  const [candidates, setCandidates] = useState<RecognitionCandidate[]>([])
  const [inputMode, setInputMode] = useState<'draw' | 'keyboard'>('draw')
  const [loading, setLoading] = useState(true)

  const canvasRef = useRef<DrawingCanvasHandle>(null)

  const currentQuestion = questions[currentIndex] ?? null

  // 次に入力されるマスのインデックス（常に左から最初の空きマス）
  const activeCell = cells.findIndex((c) => c === '')

  // 問題ロード
  useEffect(() => {
    loadKanjiData(quizState.grade)
      .then((data) => {
        let filtered = data
        if (quizState.range.type === 'unit' && quizState.range.unit) {
          filtered = data.filter((q) => q.unit === quizState.range.unit)
        }
        const shuffled = [...filtered].sort(() => Math.random() - 0.5)
        const picked = shuffled.slice(0, quizState.questionCount)
        setQuestions(picked)
        if (picked.length > 0) {
          setCells(new Array(picked[0].reading.length).fill(''))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 問題切り替え時にリセット
  useEffect(() => {
    if (!currentQuestion) return
    setCells(new Array(currentQuestion.reading.length).fill(''))
    setCandidates([])
    canvasRef.current?.clear()
  }, [currentIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // 次の空きマスに1文字追加する
  const appendChar = (char: string) => {
    const index = cells.findIndex((c) => c === '')
    if (index === -1) return
    setCells((prev) => {
      const next = [...prev]
      next[index] = char
      return next
    })
    setCandidates([])
    canvasRef.current?.clear()
  }

  // 末尾の入力済み文字を1つ削除する
  const deleteLastChar = () => {
    const indices = [...cells].map((c, i) => (c !== '' ? i : -1)).filter((i) => i !== -1)
    const lastFilled = indices[indices.length - 1]
    if (lastFilled === undefined) return
    setCells((prev) => {
      const next = [...prev]
      next[lastFilled] = ''
      return next
    })
  }

  // 認識ボタン押下後のコールバック
  const handleRecognized = (results: RecognitionCandidate[]) => {
    if (results.length === 0) return
    if (results.length === 1 || results[0].confidence >= 0.9) {
      appendChar(results[0].char)
    } else {
      setCandidates(results.slice(0, 3))
    }
  }

  const handleClearCanvas = () => {
    setCandidates([])
    canvasRef.current?.clear()
  }

  const handleReset = () => {
    if (!currentQuestion) return
    setCells(new Array(currentQuestion.reading.length).fill(''))
    setCandidates([])
    canvasRef.current?.clear()
  }

  const allFilled = cells.length > 0 && cells.every((c) => c !== '')

  const handleAnswer = () => {
    navigate('/grading', {
      state: {
        question: currentQuestion,
        userAnswer: cells.join(''),
        currentIndex,
        totalCount: questions.length,
        questions,
        quizState,
      },
    })
  }

  // ---- ローディング / エラー ----
  if (loading) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center">
        <p className="text-gray-500 text-xl">読み込み中...</p>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600 text-xl">問題が見つかりませんでした</p>
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

  const exampleParts = currentQuestion.example.split('{}')

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col">
      {/* ヘッダー */}
      <header
        className="flex items-center justify-between px-5 py-4 shadow-sm"
        style={{ background: ACCENT }}
      >
        <span className="text-white font-bold text-lg">{quizState.grade}年生 読み</span>
        <span className="text-violet-200 font-semibold text-lg">
          {currentIndex + 1} / {questions.length}
        </span>
      </header>

      <div className="flex flex-col items-center px-4 py-5 gap-5 w-full max-w-xl mx-auto">

        {/* 問題文 */}
        <div className="w-full bg-white rounded-2xl shadow px-6 py-5 flex flex-col gap-2">
          <p className="text-xl text-gray-700 text-center leading-relaxed">
            {exampleParts[0]}
            <span
              className="font-bold text-gray-900"
              style={{ borderBottom: `2px solid ${ACCENT}`, paddingBottom: '1px' }}
            >
              {currentQuestion.kanji}
            </span>
            {exampleParts[1] ?? ''}
          </p>
          <p className="text-center text-sm text-gray-400">
            {currentQuestion.reading.length}文字でこたえます
          </p>
        </div>

        {/* 解答マス — 入力は左から順に自動で埋まる */}
        <div className="flex flex-wrap justify-center gap-3">
          {cells.map((char, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold bg-white border-2 transition-all"
                style={{
                  borderColor: i === activeCell ? ACCENT : '#e2e8f0',
                  boxShadow: i === activeCell ? `0 0 0 3px ${ACCENT}33` : undefined,
                }}
              >
                {char}
              </div>
              <span className="text-xs text-gray-400">{i + 1}文字目</span>
            </div>
          ))}
        </div>

        {/* 認識候補ボタン */}
        {candidates.length > 0 && (
          <div className="flex gap-3 items-center">
            <span className="text-sm text-gray-400">候補:</span>
            {candidates.map((c, i) => (
              <button
                key={i}
                onClick={() => appendChar(c.char)}
                className="w-14 h-14 bg-violet-100 border-2 border-violet-400 rounded-xl text-2xl font-bold text-violet-800 hover:bg-violet-200"
              >
                {c.char}
              </button>
            ))}
          </div>
        )}

        {/* 手書きキャンバス / ソフトキーボード */}
        {inputMode === 'draw' ? (
          <DrawingCanvas
            ref={canvasRef}
            size={200}
            showClearButton={false}
            recognitionType="hiragana"
            onRecognized={handleRecognized}
          />
        ) : (
          <KanaKeyboard onInput={appendChar} onDelete={deleteLastChar} />
        )}

        {/* 操作ボタン群 */}
        <div className="flex gap-3 w-full">
          <ActionButton
            onClick={handleClearCanvas}
            label="消す"
            disabled={inputMode === 'keyboard'}
          />
          <ActionButton onClick={handleReset} label="やりなおし" />
          <ActionButton
            onClick={() => setInputMode((m) => (m === 'draw' ? 'keyboard' : 'draw'))}
            label={inputMode === 'draw' ? 'キーボード' : '手書きにもどす'}
            active={inputMode === 'keyboard'}
          />
        </div>

        {/* こたえるボタン */}
        <button
          onClick={handleAnswer}
          disabled={!allFilled}
          className="w-full py-5 rounded-2xl text-white text-2xl font-bold"
          style={{
            background: allFilled ? ACCENT : '#a5b4fc',
            cursor: allFilled ? 'pointer' : 'not-allowed',
          }}
        >
          こたえる
        </button>
      </div>
    </div>
  )
}

function ActionButton({
  onClick, label, disabled, active,
}: {
  onClick: () => void
  label: string
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 min-h-[48px] rounded-xl text-base font-bold border-2 transition-colors
        ${active
          ? 'border-violet-500 bg-violet-100 text-violet-800'
          : disabled
            ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        }`}
    >
      {label}
    </button>
  )
}
