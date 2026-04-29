手書き認識ライブラリ KanjiCanvas を組み込んでください。
これでアプリが「本番動作」する状態にします。

【使用するライブラリ】
- KanjiCanvas (asdfjkl版)
- リポジトリ: https://github.com/asdfjkl/kanjicanvas
- ライセンス: MIT
- クライアントサイドのみで動作、サーバー不要
- 漢字とひらがなの両方を認識可能(精度に違いはあるかもしれない)

【インストール方法】
このライブラリはnpm配布されていない場合があります。以下の手順で組み込んでください。

1. https://github.com/asdfjkl/kanjicanvas/blob/master/docs/resources/javascript/kanji-canvas.min.js
   と
   https://github.com/asdfjkl/kanjicanvas/blob/master/docs/resources/javascript/ref-patterns.js
   の2ファイルを取得

2. これらをsrc/lib/kanjicanvas/ に配置(またはpublic/に置いてindex.htmlでscript読み込み)

3. TypeScript用の型定義を簡易的に追加(window.KanjiCanvas として参照できるようにする)

【recognizer.ts の実装】
src/lib/recognizer.ts を以下のインターフェースで実装してください:

- recognizeKanji(strokes: Stroke[]): Promise<{ char: string, confidence: number }[]>
- recognizeHiragana(strokes: Stroke[]): Promise<{ char: string, confidence: number }[]>

実装内容:
- 内部でKanjiCanvasの認識ロジックを呼び出す
- KanjiCanvasは内部に専用のCanvasを持っている前提なので、
  受け取ったStroke配列を一時的なオフスクリーンCanvasに描画してKanjiCanvasに渡すか、
  KanjiCanvasのstrokes構造に直接変換する
- 戻り値は信頼度の高い順に最大3件
- recognizeHiragana では、結果のうちひらがなだけにフィルタする
  (ユニコード範囲 U+3040〜U+309F)
- recognizeKanji では、結果のうち漢字だけにフィルタする
  (ユニコード範囲 U+4E00〜U+9FFF を主とする)

【DrawingCanvas.tsx の修正】
- 現在は描画機能だけのコンポーネントを、認識機能とつなぐ
- 「認識する」ボタン、または1ストロークごとに自動認識(オプション設定可)
- 認識結果を親コンポーネントに渡すコールバック onRecognized を追加
- props: onRecognized?: (results: { char: string, confidence: number }[]) => void
- 認識タイミング: 「認識」ボタンを設けるか、書き終わって一定時間経過後の自動認識
   → デフォルトは「認識ボタン押下時」がわかりやすい

【書き取り画面 (QuizWritingPage.tsx) の修正】
- 各マスのDrawingCanvasにrecognizeKanjiの結果を反映
- 認識結果(第1候補)をマス上部に表示
- 認識候補(第2,第3)をボタンで表示し、タップで切り替えられる
- マスが認識結果で埋まったら自動で次のマスにフォーカス
- 「こたえる」ボタンを押すと、各マスの認識文字を連結して正解と比較
- 正解なら採点画面に「正解」、不正解なら「不正解」を表示

【読み画面 (QuizReadingPage.tsx) の修正】
- 上記と同様だが recognizeHiragana を使う
- それ以外は書き取りと同じロジック

【採点ロジック】
- 解答(各マスの第1候補を連結)と reading フィールドを比較
- 完全一致で正解
- 採点画面(GradingPage)に正誤と正解を渡す

【パフォーマンス】
- 認識処理は数百ms かかる可能性があるため、ボタン連打防止
- 認識中はローディング表示を出す

【既知の制約】
- 認識精度は完璧ではない
- 子どもの不安定な字や書き順違いで誤認識が発生する可能性あり
- 「キーボード」ボタンによるフォールバックは引き続き有効

修正後、変更したファイル一覧と、認識機能の使い方を箇条書きで教えてください。
もし途中で困ったこと(ライブラリ取得方法、型定義など)があれば、
その対処方法も合わせて報告してください。
