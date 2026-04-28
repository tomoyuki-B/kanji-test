/**
 * 手書き認識のプレースホルダ。
 * 後で ML モデル（例: TensorFlow.js + Tegaki）と差し替える。
 */

export interface RecognitionResult {
  candidates: string[]
  confidence: number
}

/** Canvas の ImageData を受け取り、認識候補を返す */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function recognizeKanji(_imageData: ImageData): Promise<RecognitionResult> {
  // TODO: 実際の認識処理を実装する
  return { candidates: [], confidence: 0 }
}

/** 読み（ひらがな）認識のプレースホルダ */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function recognizeHiragana(_imageData: ImageData): Promise<RecognitionResult> {
  // TODO: 実際の認識処理を実装する
  return { candidates: [], confidence: 0 }
}
