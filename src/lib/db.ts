import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export interface AnswerRecord {
  id: string
  sessionId: string
  questionId: string
  kanji: string
  reading: string
  userAnswer: string
  isCorrect: boolean
  mode: 'writing' | 'reading'
  timestamp: number
}

export interface SessionRecord {
  sessionId: string
  mode: 'writing' | 'reading'
  grade: 5 | 6
  questionCount: number
  correctCount: number
  startedAt: number
  finishedAt: number
}

interface KanjiDB extends DBSchema {
  answers: {
    key: string
    value: AnswerRecord
    indexes: { bySession: string; byQuestion: string; byDate: number }
  }
  sessions: {
    key: string
    value: SessionRecord
    indexes: { byDate: number }
  }
}

let _db: IDBPDatabase<KanjiDB> | null = null

async function getDB(): Promise<IDBPDatabase<KanjiDB>> {
  if (_db) return _db
  _db = await openDB<KanjiDB>('kanji-test', 2, {
    upgrade(db, oldVersion) {
      const raw = db as unknown as IDBDatabase
      if (oldVersion < 2) {
        if (raw.objectStoreNames.contains('records')) {
          raw.deleteObjectStore('records')
        }
        const answers = db.createObjectStore('answers', { keyPath: 'id' })
        answers.createIndex('bySession', 'sessionId')
        answers.createIndex('byQuestion', 'questionId')
        answers.createIndex('byDate', 'timestamp')
        const sessions = db.createObjectStore('sessions', { keyPath: 'sessionId' })
        sessions.createIndex('byDate', 'startedAt')
      }
    },
  })
  return _db
}

export async function saveAnswer(record: Omit<AnswerRecord, 'id'>): Promise<void> {
  const db = await getDB()
  const id = `${record.sessionId}-${record.questionId}-${record.timestamp}`
  await db.put('answers', { ...record, id })
}

export async function saveSession(record: SessionRecord): Promise<void> {
  const db = await getDB()
  await db.put('sessions', record)
}

export async function getRecentSessions(limit: number): Promise<SessionRecord[]> {
  const db = await getDB()
  const all = await db.getAll('sessions')
  return all.sort((a, b) => b.startedAt - a.startedAt).slice(0, limit)
}

export interface Stats {
  todayCorrectRate: number | null
  streak: number
  totalQuestions: number
  hasWeakData: boolean
}

export async function getStats(): Promise<Stats> {
  const db = await getDB()
  const all = await db.getAll('answers')

  const totalQuestions = all.length

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayAnswers = all.filter((a) => a.timestamp >= todayStart.getTime())
  const todayCorrectRate =
    todayAnswers.length > 0
      ? Math.round((todayAnswers.filter((a) => a.isCorrect).length / todayAnswers.length) * 100)
      : null

  const streak = calcStreak(all)
  const hasWeakData = all.some((a) => !a.isCorrect)

  return { todayCorrectRate, streak, totalQuestions, hasWeakData }
}

function calcStreak(records: AnswerRecord[]): number {
  if (records.length === 0) return 0
  const days = new Set(records.map((r) => new Date(r.timestamp).toDateString()))
  let streak = 0
  const today = new Date()
  for (let i = 0; ; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (days.has(d.toDateString())) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export interface WeakKanji {
  questionId: string
  kanji: string
  reading: string
  mistakeCount: number
}

export async function getWeakKanji(limit: number): Promise<WeakKanji[]> {
  const db = await getDB()
  const all = await db.getAll('answers')

  const map = new Map<string, { kanji: string; reading: string; mistakes: number }>()
  for (const a of all) {
    const entry = map.get(a.questionId) ?? { kanji: a.kanji, reading: a.reading, mistakes: 0 }
    if (!a.isCorrect) entry.mistakes++
    map.set(a.questionId, entry)
  }

  return [...map.entries()]
    .filter(([, e]) => e.mistakes > 0)
    .sort((a, b) => b[1].mistakes - a[1].mistakes)
    .slice(0, limit)
    .map(([questionId, e]) => ({ questionId, kanji: e.kanji, reading: e.reading, mistakeCount: e.mistakes }))
}

export interface DailyStat {
  date: string
  label: string
  correctRate: number | null
}

export async function getDailyStats(): Promise<DailyStat[]> {
  const db = await getDB()
  const all = await db.getAll('answers')

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const dayAnswers = all.filter((a) => a.timestamp >= d.getTime() && a.timestamp < next.getTime())
    return {
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('ja-JP', { weekday: 'short' }),
      correctRate:
        dayAnswers.length > 0
          ? Math.round((dayAnswers.filter((a) => a.isCorrect).length / dayAnswers.length) * 100)
          : null,
    }
  })
}
