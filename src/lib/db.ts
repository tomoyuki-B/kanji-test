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
