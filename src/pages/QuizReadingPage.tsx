import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import DrawingCanvas, { type DrawingCanvasHandle } from '../components/DrawingCanvas'
import KanaKeyboard from '../components/KanaKeyboard'
import ResultOverlay from '../components/ResultOverlay'
import Toast from '../components/Toast'
import { loadKanjiData, type KanjiQuestion } from '../lib/kanjiLoader'
import { type RecognitionCandidate } from '../lib/recognizer'
import { getWeakKanji } from '../lib/db'
import { type QuizAnswer, type ResultNavState } from '../lib/types'

const ACCENT = '#534AB7'

interface LocationState {
  grade: 1 | 2 | 3 | 4 | 5 | 6
  range: { type: 'random' | 'unit' | 'weak'; unit?: string }
  questionCount: 5 | 10 | 20
}

interface OverlayState {
  isCorrect: boolean
  kanji: string
  reading: string
  answersSnapshot: QuizAnswer[]
  nextIndex: number
}

const FALLBACK_STATE: LocationState = { grade: 5, range: { type: 'random' }, questionCount: 10 }

export default function QuizReadingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const quizState: LocationState = (location.state as LocationState) ?? FALLBACK_STATE

  const [questions, setQuestions] = useState<KanjiQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cells, setCells] = useState<string[]>([])
  const [candidates, setCandidates] = useState<RecognitionCandidate[]>([])
  const [inputMode, setInputMode] = useState<'draw' | 'keyboard'>('draw')
  const [loading, setLoading] = useState(true)
  const [overlayState, setOverlayState] = useState<OverlayState | null>(null)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [startedAt] = useState(() => Date.now())
  const [failCount, setFailCount] = useState(0)
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const canvasRef = useRef<DrawingCanvasHandle>(null)

  const currentQuestion = questions[currentIndex] ?? null
  const activeCell = cells.findIndex((c) => c === '')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await loadKanjiData(quizState.grade)
        let filtered = data
        if (quizState.range.type === 'unit' && quizState.range.unit) {
          filtered = data.filter((q) => q.unit === quizState.range.unit)
        } else if (quizState.range.type === 'weak') {
          const weakList = await getWeakKanji(100)
          const weakIds = new Set(weakList.map((w) => w.questionId))
          filtered = data.filter((q) => weakIds.has(q.id))
        }
        const shuffled = [...filtered].sort(() => Math.random() - 0.5)
        const picked = shuffled.slice(0, quizState.questionCount)
        setQuestions(picked)
        if (picked.length > 0) {
          setCells(new Array(picked[0].reading.length).fill(''))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!currentQuestion) return
    setCells(new Array(currentQuestion.reading.length).fill(''))
    setCandidates([])
    setFailCount(0)
    setToastVisible(false)
    canvasRef.current?.clear()
  }, [currentIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const DAKUTEN_MAP: Record<string, string> = {
    'か': 'が', 'き': 'ぎ', 'く': 'ぐ', 'け': 'げ', 'こ': 'ご',
    'さ': 'ざ', 'し': 'じ', 'す': 'ず', 'せ': 'ぜ', 'そ': 'ぞ',
    'た': 'だ', 'ち': 'ぢ', 'つ': 'づ', 'て': 'で', 'と': 'ど',
    'は': 'ば', 'ひ': 'び', 'ふ': 'ぶ', 'へ': 'べ', 'ほ': 'ぼ',
  }
  const HANDAKUTEN_MAP: Record<string, string> = {
    'は': 'ぱ', 'ひ': 'ぴ', 'ふ': 'ぷ', 'へ': 'ぺ', 'ほ': 'ぽ',
  }

  const handleKeyboardInput = (char: string) => {
    if (char === '゛' || char === '゜') {
      const map = char === '゛' ? DAKUTEN_MAP : HANDAKUTEN_MAP
      const filledIndices = cells.map((c, i) => (c !== '' ? i : -1)).filter((i) => i !== -1)
      const lastIdx = filledIndices[filledIndices.length - 1]
      if (lastIdx === undefined) return
      const combined = map[cells[lastIdx]]
      if (!combined) return
      setCells((prev) => {
        const next = [...prev]
        next[lastIdx] = combined
        return next
      })
      return
    }
    appendChar(char)
  }

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

  const handleRecognized = (results: RecognitionCandidate[]) => {
    if (results.length === 0) {
      const newCount = failCount + 1
      setFailCount(newCount)
      if (newCount >= 2) {
        setInputMode('keyboard')
        setToastMessage('キーボードに切りかえたよ。キーボードでこたえてみよう')
      } else {
        setToastMessage('うまく認識できなかったよ。もう一度書いてみよう')
      }
      setToastVisible(true)
      return
    }
    setFailCount(0)
    if (results.length === 1 || results[0].confidence >= 0.9) {
      appendChar(results[0].char)
    } else {
      setCandidates(results)
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
    if (!currentQuestion) return
    const userAnswer = cells.join('')
    const isCorrect = userAnswer === currentQuestion.reading
    const newAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      kanji: currentQuestion.kanji,
      reading: currentQuestion.reading,
      userAnswer,
      isCorrect,
      example: currentQuestion.example,
      meaning: currentQuestion.meaning,
    }
    const newAnswers = [...answers, newAnswer]
    setAnswers(newAnswers)
    setOverlayState({
      isCorrect,
      kanji: currentQuestion.kanji,
      reading: currentQuestion.reading,
      answersSnapshot: newAnswers,
      nextIndex: currentIndex + 1,
    })
  }

  const handleNext = () => {
    if (!overlayState) return
    const { nextIndex, answersSnapshot } = overlayState
    setOverlayState(null)
    if (nextIndex >= questions.length) {
      const resultState: ResultNavState = {
        answers: answersSnapshot,
        mode: 'reading',
        grade: quizState.grade,
        questionCount: questions.length,
        startedAt,
        quizState,
      }
      navigate('/result', { state: resultState })
    } else {
      setCurrentIndex(nextIndex)
    }
  }

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
    <div
      className="min-h-screen bg-sky-50 flex flex-col"
      style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' } as React.CSSProperties}
    >
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      {overlayState && (
        <ResultOverlay
          isCorrect={overlayState.isCorrect}
          kanji={overlayState.kanji}
          reading={overlayState.reading}
          mode="reading"
          onNext={handleNext}
        />
      )}

      <header
        className="flex items-center justify-between px-5 py-4 shadow-sm"
        style={{ background: ACCENT }}
      >
        <button
          onClick={() => navigate('/')}
          className="text-violet-200 font-semibold text-base px-2 py-1 rounded-lg"
        >
          ← ホーム
        </button>
        <span className="text-white font-bold text-lg">{quizState.grade}年生 読み</span>
        <span className="text-violet-200 font-semibold text-lg">
          {currentIndex + 1} / {questions.length}
        </span>
      </header>

      <div className="flex flex-col items-center px-4 py-5 gap-5 w-full max-w-xl mx-auto">

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

        <div key={currentIndex} className="flex flex-wrap justify-center gap-3">
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

        {candidates.length > 0 && (
          <div className="flex gap-2 items-center overflow-x-auto w-full pb-1">
            <span className="text-sm text-gray-400 shrink-0">候補:</span>
            {candidates.map((c, i) => (
              <button
                key={i}
                onClick={() => appendChar(c.char)}
                style={{ touchAction: 'manipulation', flexShrink: 0 }}
                className="w-14 h-14 bg-violet-100 border-2 border-violet-400 rounded-xl text-2xl font-bold text-violet-800 hover:bg-violet-200"
              >
                {c.char}
              </button>
            ))}
          </div>
        )}

        {inputMode === 'draw' ? (
          <DrawingCanvas
            ref={canvasRef}
            size={200}
            showClearButton={false}
            recognitionType="hiragana"
            onRecognized={handleRecognized}
          />
        ) : (
          <KanaKeyboard onInput={handleKeyboardInput} onDelete={deleteLastChar} />
        )}

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
