# 漢字テスト

小学校 5〜6 年生向けの漢字テスト Web アプリ。iPad Safari + Apple Pencil での手書き入力に対応。

## 技術スタック

- Vite + React + TypeScript
- Tailwind CSS
- IndexedDB (idb)
- react-router-dom

---

## 開発サーバーの起動

```bash
npm install
npm run dev
```

起動後、`http://localhost:5173` でアクセスできます。

### iPad からの接続方法

1. Mac と iPad を同じ Wi-Fi に接続する
2. Mac の IP アドレスを確認する

   ```bash
   ipconfig getifaddr en0
   # 例: 192.168.1.5
   ```

3. iPad の Safari で `http://<MACのIP>:5173` を開く

> `npm run dev` は `--host` フラグ付きで起動しているため、LAN 上のデバイスからアクセス可能です。

---

## ビルド・配布手順

### ローカルビルド

```bash
npm run build
# dist/ フォルダに成果物が生成される
npm run preview  # ビルド結果の動作確認
```

### GitHub Pages へのデプロイ

1. `vite.config.ts` の `base` をリポジトリ名に設定する

   ```ts
   base: '/kanji-test/',
   ```

2. `gh-pages` パッケージでデプロイ

   ```bash
   npm install -D gh-pages
   # package.json の scripts に追加:
   # "deploy": "gh-pages -d dist"
   npm run build && npm run deploy
   ```

### Cloudflare Pages へのデプロイ

1. GitHub リポジトリを Cloudflare Pages に接続する
2. ビルド設定を以下のように設定する

   | 項目 | 値 |
   |---|---|
   | フレームワーク | Vite |
   | ビルドコマンド | `npm run build` |
   | 出力ディレクトリ | `dist` |

3. プッシュするたびに自動デプロイされる

---

## フォルダ構成

```
src/
  pages/          # 各画面コンポーネント
  components/     # DrawingCanvas, KanaKeyboard など共通 UI
  lib/            # kanjiLoader.ts, db.ts, recognizer.ts
public/
  data/
    kanji-grade5.json
    kanji-grade6.json
```

## データ形式

`public/data/kanji-grade5.json` および `kanji-grade6.json` に以下の形式で漢字データを追加してください。

```json
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
```

- `example` の `{}` が解答マスに対応します。
- `type`: `jukugo`（熟語）/ `single`（単漢字）/ `okurigana`（送り仮名付き）

## 次のステップ

- [ ] 手書き Canvas の認識処理（`src/lib/recognizer.ts` のプレースホルダを実装）
- [ ] IndexedDB を使った成績の保存・表示
- [ ] 問題データの本格整備
