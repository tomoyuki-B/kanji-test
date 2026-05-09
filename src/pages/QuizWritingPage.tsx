import { useRef, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import DrawingCanvas, { type DrawingCanvasHandle } from '../components/DrawingCanvas'
import ResultOverlay from '../components/ResultOverlay'
import Toast from '../components/Toast'
import { type RecognitionCandidate } from '../lib/recognizer'
import { loadKanjiData, type KanjiQuestion } from '../lib/kanjiLoader'
import { getWeakKanji } from '../lib/db'
import { type QuizAnswer, type ResultNavState } from '../lib/types'

const ACCENT = '#534AB7'
const CANVAS_SIZE = 240

interface LocationState {
  mode: 'writing' | 'reading'
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

interface Slot {
  char: string
  readingHint: string
}

function isHiragana(c: string) {
  return c >= '\u3040' && c <= '\u309f'
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

function getOkurigana(kanji: string, type: string): string {
  if (type !== 'okurigana') return ''
  const chars = [...kanji]
  const splitIdx = chars.findIndex(c => isHiragana(c))
  return splitIdx === -1 ? '' : chars.slice(splitIdx).join('')
}

function buildSlots(kanji: string, reading: string, type: string): Slot[] {
  const chars = [...kanji]

  if (type !== 'okurigana') {
    const hints = splitReading(kanji, reading)
    return chars.map((c, i) => ({ char: c, readingHint: hints[i] }))
  }

  const splitIdx = chars.findIndex(c => isHiragana(c))
  const kanjiPart = splitIdx === -1 ? chars : chars.slice(0, splitIdx)
  const kanaLen = splitIdx === -1 ? 0 : chars.length - splitIdx
  const kanjiReading = kanaLen > 0 ? reading.slice(0, reading.length - kanaLen) : reading

  if (kanjiPart.length === 1) {
    return [{ char: kanjiPart[0], readingHint: kanjiReading }]
  }
  const hints = splitReading(kanjiPart.join(''), kanjiReading)
  return kanjiPart.map((c, i) => ({ char: c, readingHint: hints[i] }))
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
  const [failCounts, setFailCounts] = useState<number[]>([])
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const canvasRefs = useRef<(DrawingCanvasHandle | null)[]>([])

  const currentQuestion = questions[currentIndex] ?? null
  const slots = currentQuestion
    ? buildSlots(currentQuestion.kanji, currentQuestion.reading, currentQuestion.type)
    : []
  const okurigana = currentQuestion ? getOkurigana(currentQuestion.kanji, currentQuestion.type) : ''

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
          const firstSlots = buildSlots(picked[0].kanji, picked[0].reading, picked[0].type)
          setRecognizedChars(new Array(firstSlots.length).fill(null))
          setCandidatesPerSlot(new Array(firstSlots.length).fill([]))
          setFailCounts(new Array(firstSlots.length).fill(0))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!currentQuestion) return
    const s = buildSlots(currentQuestion.kanji, currentQuestion.reading, currentQuestion.type)
    setRecognizedChars(new Array(s.length).fill(null))
    setCandidatesPerSlot(new Array(s.length).fill([]))
    setFailCounts(new Array(s.length).fill(0))
    setToastVisible(false)
    canvasRefs.current.forEach((ref) => ref?.clear())
  }, [currentIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecognized = (slotIndex: number) => (results: RecognitionCandidate[]) => {
    if (results.length === 0) {
      const newCount = (failCounts[slotIndex] ?? 0) + 1
      setFailCounts((prev) => {
        const next = [...prev]
        next[slotIndex] = newCount
        return next
      })
      setToastMessage(
        newCount >= 2
          ? 'うまくいかないときは、「答えを見る」ボタンを使ってみてね'
          : 'うまく認識できなかったよ。もう一度書いてみよう'
      )
      setToastVisible(true)
      return
    }
    setFailCounts((prev) => {
      const next = [...prev]
      next[slotIndex] = 0
      return next
    })
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

  const handleShowAnswer = () => {
    if (!currentQuestion) return
    const newAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      kanji: currentQuestion.kanji,
      reading: currentQuestion.reading,
      userAnswer: '',
      isCorrect: false,
      example: currentQuestion.example,
      meaning: currentQuestion.meaning,
    }
    const newAnswers = [...answers, newAnswer]
    setAnswers(newAnswers)
    setOverlayState({
      isCorrect: false,
      kanji: currentQuestion.kanji,
      reading: currentQuestion.reading,
      answersSnapshot: newAnswers,
      nextIndex: currentIndex + 1,
    })
  }

  const showAnswerProminent = failCounts.some((c) => c >= 2)

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
  const userAnswer = recognizedChars.map((c) => c ?? '').join('') + okurigana

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
    <div
      className="min-h-screen bg-sky-50 flex flex-col items-center p-5 gap-5"
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

      {/* 解答スロット */}
      <div key={currentIndex} className="flex flex-wrap justify-center items-end gap-4">
        {slots.map((slot, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            {/* 認識結果表示 */}
            <div
              className="rounded-xl border-2 flex items-center justify-center font-bold bg-white"
              style={{
                width: 64,
                height: 64,
                fontSize: '30px',
                borderColor: recognizedChars[i] ? ACCENT : '#e2e8f0',
              }}
            >
              {recognizedChars[i] ?? ''}
            </div>

            {/* 候補ボタン（最大8件・横スクロール） */}
            {(candidatesPerSlot[i]?.length ?? 0) > 0 && (
              <div className="flex gap-1 overflow-x-auto max-w-[260px] pb-1">
                {candidatesPerSlot[i].map((c) => (
                  <button
                    key={c.char}
                    onClick={() => handleSelectCandidate(i, c.char)}
                    style={{ touchAction: 'manipulation', flexShrink: 0 }}
                    className="w-9 h-9 bg-violet-50 border border-violet-300 rounded-lg text-base font-bold text-violet-700"
                  >
                    {c.char}
                  </button>
                ))}
              </div>
            )}

            {/* 手書きキャンバス */}
            <DrawingCanvas
              ref={(el) => { canvasRefs.current[i] = el }}
              size={CANVAS_SIZE}
              readingHint={slot.readingHint}
              recognitionType="kanji"
              gradeLimit={currentQuestion.grade as 1 | 2 | 3 | 4 | 5 | 6}
              onRecognized={handleRecognized(i)}
            />
          </div>
        ))}

        {/* 送り仮名（最初から表示） */}
        {okurigana && (
          <div className="flex flex-col items-center justify-end pb-16">
            <span className="text-5xl font-bold text-gray-800">{okurigana}</span>
          </div>
        )}
      </div>

      <button
        onClick={handleAnswer}
        disabled={!allFilled}
        className="w-full max-w-2xl py-5 rounded-2xl text-white text-2xl font-bold"
        style={{
          background: allFilled ? ACCENT : '#a5b4fc',
          cursor: allFilled ? 'pointer' : 'not-allowed',
          touchAction: 'manipulation',
        }}
      >
        こたえる
      </button>

      <button
        onClick={handleShowAnswer}
        style={{ touchAction: 'manipulation' }}
        className={`w-full max-w-2xl py-4 rounded-2xl text-lg font-bold border-2 transition-all
          ${showAnswerProminent
            ? 'border-amber-400 bg-amber-50 text-amber-700'
            : 'border-gray-200 bg-white text-gray-400'
          }`}
      >
        答えを見る
      </button>
    </div>
  )
}
