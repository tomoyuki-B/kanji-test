小学校5〜6年生の子ども向けの漢字テスト Web アプリを作ります。
以下の仕様でプロジェクトの雛形を作ってください。

【目的】
- 自宅の iPad の Safari で、子どもが漢字の勉強をするためのアプリ
- Mac で開発 → 同じ Wi-Fi の iPad で開発サーバーにアクセスして実機確認
- 完成後は GitHub Pages か Cloudflare Pages で配布する想定

【技術スタック】
- Vite + React + TypeScript
- スタイル: Tailwind CSS
- データ保存: IndexedDB(idb ライブラリ)を使う
- 手書き認識: 後で組み込むので今は Canvas での描画だけ実装してプレースホルダ関数を用意
- 状態管理: 最初はシンプルに React の useState/useReducer でOK
- ルーティング: react-router-dom

【画面構成】
1. ホーム画面: 範囲を選んで「テスト開始」
2. 出題画面(書き取り): 解答文字数ぶんマス目を並べて、各マスに漢字を手書き
3. 出題画面(読み): 解答文字数ぶんマス目を並べて、各マスにひらがなを手書き
   ・誤認識時のフォールバック用に 50音ソフトキーボード切替ボタンを用意
4. 採点・解説画面: 1問ごとに正誤を表示
5. 結果画面: 10問終了後に正答率と苦手な漢字を表示
6. 成績画面: 累計の正答率、連続学習日数、苦手な漢字一覧、苦手だけ復習機能

【iPad 対応で必須の点】
- Apple Pencil の Pointer Events に対応(touch だけでなく pointerdown/move/up を使う)
- 縦持ち・横持ちどちらでも見やすいレイアウト
- ボタンは指でタップしやすい最小 44px 四方を確保
- ダブルタップでのズームを抑制(viewport meta + touch-action: manipulation)

【データ構造】
漢字データは public/data/kanji-grade5.json と kanji-grade6.json に分ける。
1問は以下の形式:
{
  "id": "g5-001",
  "grade": 5,
  "unit": "国語上 第1単元",
  "kanji": "興奮",
  "reading": "こうふん",
  "type": "jukugo",
  "example": "この本は{}する内容だ。",
  "meaning": "気持ちが高ぶること"
}

【今回作ってほしい範囲】
- プロジェクトの初期化(package.json, vite.config, tsconfig, tailwind 設定)
- フォルダ構成(src/pages, src/components, src/lib, src/data, public/data)
- ルーティングの骨組みだけ(各画面は仮の中身でOK)
- iPad 用 viewport 設定と touch-action 設定
- README.md に「開発サーバーの起動」「iPad からの接続方法」「ビルド・配布手順」を書く

まずは雛形だけで OK です。漢字データのサンプル JSON はこちらで用意するので、
構造を受け入れる側のローダー関数だけ書いてください。
完成したら次のステップ(手書き Canvas の実装)に進みます。
