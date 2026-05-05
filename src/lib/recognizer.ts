import { getKanjiUpToGrade } from '../data/grade-kanji-list'

export interface RecognitionCandidate {
  char: string
  confidence: number
}

// DrawingCanvas が記録するストローク形式: [[x,y], ...] の配列
export type RawStroke = [number, number][]

interface RecognizeOptions {
  gradeLimit?: 1 | 2 | 3 | 4 | 5 | 6
}

const HIDDEN_ID = 'kc_recognizer'

function isReady(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.KanjiCanvas &&
    window.KanjiCanvas.refPatterns.length > 0
  )
}

function ensureInit() {
  const kc = window.KanjiCanvas
  // 初回だけ init（canvas_kc_recognizer がセットされていなければ）
  if (!kc[`canvas_${HIDDEN_ID}`]) {
    kc.init(HIDDEN_ID)
  }
}

/**
 * DrawingCanvas が記録した RawStroke[] を KanjiCanvas に注入して認識する。
 * KanjiCanvas.recognize() は momentNormalize → fineClassification の順に処理し、
 * 結果を "一  二  三  " のような 2スペース区切り文字列で返す。
 */
function runRecognition(
  strokes: RawStroke[],
  filter: (cp: number) => boolean,
): RecognitionCandidate[] {
  if (!isReady() || strokes.length === 0) return []
  ensureInit()

  const kc = window.KanjiCanvas
  // strokes を直接注入（KanjiCanvas の内部構造と同じ [[x,y],...] 形式）
  kc[`recordedPattern_${HIDDEN_ID}`] = strokes

  const raw: string = (kc.recognize(HIDDEN_ID) as string) ?? ''
  const chars = raw.split(/\s+/).filter(Boolean)

  return chars
    .filter((ch) => {
      const cp = ch.codePointAt(0) ?? 0
      return filter(cp)
    })
    .slice(0, 8)
    .map((char, i) => ({ char, confidence: 1.0 - i * 0.08 }))
}

/** 漢字認識（U+4E00–U+9FFF + 拡張漢字 U+3400–U+4DBF） */
export async function recognizeKanji(
  strokes: RawStroke[],
  options?: RecognizeOptions,
): Promise<RecognitionCandidate[]> {
  if (options?.gradeLimit !== undefined) {
    const allowed = new Set(getKanjiUpToGrade(options.gradeLimit))
    const results = runRecognition(strokes, (cp) => allowed.has(String.fromCodePoint(cp)))
    // フィルタ後に0件なら全漢字でリトライ
    if (results.length === 0) {
      return runRecognition(strokes, (cp) => (cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0x3400 && cp <= 0x4dbf))
    }
    return results
  }
  return runRecognition(strokes, (cp) => (cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0x3400 && cp <= 0x4dbf))
}

/** ひらがな認識（U+3040–U+309F） */
export async function recognizeHiragana(strokes: RawStroke[]): Promise<RecognitionCandidate[]> {
  return runRecognition(strokes, (cp) => cp >= 0x3040 && cp <= 0x309f)
}
