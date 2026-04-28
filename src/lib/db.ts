import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface QuizRecord {
  id: string
  questionId: string
  correct: boolean
  answeredAt: number
}

interface KanjiDB extends DBSchema {
  records: {
    key: string
    value: QuizRecord
    indexes: { byQuestion: string; byDate: number }
  }
}

let _db: IDBPDatabase<KanjiDB> | null = null

async function getDB(): Promise<IDBPDatabase<KanjiDB>> {
  if (_db) return _db
  _db = await openDB<KanjiDB>('kanji-test', 1, {
    upgrade(db) {
      const store = db.createObjectStore('records', { keyPath: 'id' })
      store.createIndex('byQuestion', 'questionId')
      store.createIndex('byDate', 'answeredAt')
    },
  })
  return _db
}

export async function saveRecord(record: Omit<QuizRecord, 'id'>): Promise<void> {
  const db = await getDB()
  const id = `${record.questionId}-${record.answeredAt}`
  await db.put('records', { ...record, id })
}

export async function getAllRecords(): Promise<QuizRecord[]> {
  const db = await getDB()
  return db.getAll('records')
}

export async function getRecordsByQuestion(questionId: string): Promise<QuizRecord[]> {
  const db = await getDB()
  return db.getAllFromIndex('records', 'byQuestion', questionId)
}

export interface Stats {
  todayCorrectRate: number | null
  streak: number
  totalQuestions: number
  hasWeakData: boolean
}

export async function getStats(): Promise<Stats> {
  const db = await getDB()
  const all = await db.getAll('records')

  const totalQuestions = all.length

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayRecords = all.filter((r) => r.answeredAt >= todayStart.getTime())
  const todayCorrectRate =
    todayRecords.length > 0
      ? Math.round((todayRecords.filter((r) => r.correct).length / todayRecords.length) * 100)
      : null

  const streak = calcStreak(all)

  // 苦手判定: 同じ問題を2回以上解いて直近が不正解のもの
  const byQuestion = new Map<string, QuizRecord[]>()
  for (const r of all) {
    const arr = byQuestion.get(r.questionId) ?? []
    arr.push(r)
    byQuestion.set(r.questionId, arr)
  }
  let hasWeakData = false
  for (const records of byQuestion.values()) {
    records.sort((a, b) => b.answeredAt - a.answeredAt)
    if (records.length >= 2 && !records[0].correct) {
      hasWeakData = true
      break
    }
  }

  return { todayCorrectRate, streak, totalQuestions, hasWeakData }
}

function calcStreak(records: QuizRecord[]): number {
  if (records.length === 0) return 0
  const days = new Set(records.map((r) => new Date(r.answeredAt).toDateString()))
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
