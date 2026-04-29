import { useRef, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import DrawingCanvas, { type DrawingCanvasHandle } from '../components/DrawingCanvas'
import ResultOverlay from '../components/ResultOverlay'
import { type RecognitionCandidate } from '../lib/recognizer'
import { loadKanjiData, type KanjiQuestion } from '../lib/kanjiLoader'
import { getWeakKanji } from '../lib/db'
import { type QuizAnswer, type ResultNavState } from '../lib/types'

const ACCENT = '#534AB7'

interface LocationState {
  mode: 'writing' | 'reading'
  grade: 5 | 6
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

function splitReading(kanji: string, reading: string): string[] {
  const kanjiLen = kanji.length
  if (kanjiLen === 1) return [reading]
  const kanaChars = [...reading]
  const base = Math.floor(kanaChars.length / kanjiLen)
  const remainder = kanaChars.length % kanjiLen
  return Array.from({ length: kanjiLen }, (_, i) => {
    const start = i * base + Math.min(i, remainder)
    const len = base + (i < remainder ? 1 : 0)
    return kanaChars.slice(start, start + len).join('')
  })
}

const FALLBACK_STATE: LocationState = { mode: 'writing', grade: 5, range: { type: 'random' }, questionCount: 10 }

export default function QuizWritingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const quizState: LocationState = (location.state as LocationState) ?? FALLBACK_STATE

  const [questions, setQuestions] = useState<KanjiQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [recognizedChars, setRecognizedChars] = useState<(string | null)[]>([])
  const [candidatesPerSlot, setCandidatesPerSlot] = useState<RecognitionCandidate[][]>([])
  const [loading, setLoading] = useState(true)
  const [overlayState, setOverlayState] = useState<OverlayState | null>(null)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [startedAt] = useState(() => Date.now())

  const canvasRefs = useRef<(DrawingCanvasHandle | null)[]>([])

  const currentQuestion = questions[currentIndex] ?? null

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
          setRecognizedChars(new Array(picked[0].kanji.length).fill(null))
          setCandidatesPerSlot(new Array(picked[0].kanji.length).fill([]))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!currentQuestion) return
    setRecognizedChars(new Array(currentQuestion.kanji.length).fill(null))
    setCandidatesPerSlot(new Array(currentQuestion.kanji.length).fill([]))
    canvasRefs.current.forEach((ref) => ref?.clear())
  }, [currentIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const chars = currentQuestion?.kanji.split('') ?? []
  const readingHints = currentQuestion ? splitReading(currentQuestion.kanji, currentQuestion.reading) : []

  const handleRecognized = (slotIndex: number) => (results: RecognitionCandidate[]) => {
    if (results.length === 0) return
    setRecognizedChars((prev) => {
      const next = [...prev]
      next[slotIndex] = results[0].char
      return next
    })
    setCandidatesPerSlot((prev) => {
      const next = [...prev]
      next[slotIndex] = results.slice(1)
      return next
    })
  }

  const handleSelectCandidate = (slotIndex: number, char: string) => {
    setRecognizedChars((prev) => {
      const next = [...prev]
      next[slotIndex] = char
      return next
    })
    setCandidatesPerSlot((prev) => {
      const next = [...prev]
      next[slotIndex] = next[slotIndex].filter((c) => c.char !== char)
      return next
    })
  }

  const allFilled = recognizedChars.length > 0 && recognizedChars.every((c) => c !== null)
  const userAnswer = recognizedChars.map((c) => c ?? '').join('')

  const handleAnswer = () => {
    if (!currentQuestion) return
    const isCorrect = userAnswer === currentQuestion.kanji
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
        mode: 'writing',
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
    <div className="min-h-screen bg-sky-50 flex flex-col items-center p-5 gap-5">
      {overlayState && (
        <ResultOverlay
          isCorrect={overlayState.isCorrect}
          kanji={overlayState.kanji}
          reading={overlayState.reading}
          mode="writing"
          onNext={handleNext}
        />
      )}

      <header className="w-full flex items-center justify-between px-1 pt-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-violet-400 font-semibold text-base px-2 py-1 rounded-lg hover:bg-violet-50"
        >
          ← ホーム
        </button>
        <h2 className="text-2xl font-bold" style={{ color: ACCENT }}>書き取り</h2>
        <span className="font-semibold text-lg" style={{ color: ACCENT }}>
          {currentIndex + 1} / {questions.length}
        </span>
      </header>

      <p className="text-xl text-gray-700 bg-white rounded-xl px-6 py-4 shadow w-full max-w-2xl text-center">
        {exampleParts[0]}
        <span className="text-red-500 font-bold">{currentQuestion.reading}</span>
        {exampleParts[1] ?? ''}
      </p>

      <div key={currentIndex} className="flex flex-wrap justify-center gap-6">
        {chars.map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div
              className="w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-bold bg-white"
              style={{ borderColor: recognizedChars[i] ? ACCENT : '#e2e8f0' }}
            >
              {recognizedChars[i] ?? ''}
            </div>

            {(candidatesPerSlot[i]?.length ?? 0) > 0 && (
              <div className="flex gap-1">
                {candidatesPerSlot[i].map((c) => (
                  <button
                    key={c.char}
                    onClick={() => handleSelectCandidate(i, c.char)}
                    className="w-10 h-10 bg-violet-50 border border-violet-300 rounded-lg text-lg font-bold text-violet-700"
                  >
                    {c.char}
                  </button>
                ))}
              </div>
            )}

            <DrawingCanvas
              ref={(el) => { canvasRefs.current[i] = el }}
              size={240}
              readingHint={readingHints[i]}
              recognitionType="kanji"
              onRecognized={handleRecognized(i)}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleAnswer}
        disabled={!allFilled}
        className="w-full max-w-2xl py-5 rounded-2xl text-white text-2xl font-bold"
        style={{
          background: allFilled ? ACCENT : '#a5b4fc',
          cursor: allFilled ? 'pointer' : 'not-allowed',
        }}
      >
        こたえる
      </button>
    </div>
  )
}
