// Stroke は [x, y] 座標のペア配列
type KCStroke = [number, number][]

interface KanjiCanvasStatic {
  refPatterns: unknown[]
  init(canvasId: string): void
  recognize(canvasId: string): string
  erase(canvasId: string): void
  deleteLast(canvasId: string): void
  // strokes の直接注入に使う動的プロパティ
  [key: string]: unknown
}

declare global {
  interface Window {
    KanjiCanvas: KanjiCanvasStatic
  }
}

export {}
