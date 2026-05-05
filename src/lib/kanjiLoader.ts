export interface KanjiQuestion {
  id: string
  grade: 1 | 2 | 3 | 4 | 5 | 6
  unit: string
  kanji: string
  reading: string
  type: 'jukugo' | 'single' | 'okurigana'
  example: string
  meaning: string
}

let cache: Record<number, KanjiQuestion[]> = {}

export async function loadKanjiData(grade: 1 | 2 | 3 | 4 | 5 | 6): Promise<KanjiQuestion[]> {
  if (cache[grade]) return cache[grade]
  const res = await fetch(`/data/kanji-grade${grade}.json`)
  if (!res.ok) throw new Error(`Failed to load kanji data for grade ${grade}`)
  const data: KanjiQuestion[] = await res.json()
  cache[grade] = data
  return data
}

/** キャッシュをクリアする（テスト用） */
export function clearKanjiCache() {
  cache = {}
}
