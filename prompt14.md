手書き認識の精度・使い勝手を改善します。
学年別漢字データ(src/data/grade-kanji-list.ts)が用意できたので、
これを使って認識精度を上げます。

==========================================
【重要】 作業時の制約
==========================================
- src/lib/kanjicanvas/kanji-canvas.min.js は読まないでください
- src/lib/kanjicanvas/ref-patterns.js も読まないでください
  (これらはミニファイ済み・大量データのため、内容理解は不要)
- これらのファイルは認識ライブラリ本体で、変更対象外です
- 必要なら他のファイル(recognizer.ts, QuizWritingPage.tsx 等)から
  どう呼び出されているかだけ確認してください

==========================================
1. 学年別漢字データの統合準備
==========================================

src/data/grade-kanji-list.ts には以下が定義されています:
- GRADE_1_KANJI 〜 GRADE_4_KANJI (1〜4年生の配当漢字)
- getKanjiUpToGrade(grade, grade5, grade6): 累積配当漢字を取得
- isKanjiUpToGrade(char, grade, grade5, grade6): 配当漢字判定

【5・6年生の配当漢字を取得する関数を追加】
src/data/grade-kanji-list.ts を編集し、5・6年生の配当漢字を
public/data/kanji-grade5.json と kanji-grade6.json から
動的に抽出する関数を追加してください。

実装イメージ:
```typescript
import grade5Data from '../../public/data/kanji-grade5.json';
import grade6Data from '../../public/data/kanji-grade6.json';

function extractKanjiFromJson(data: Array<{kanji: string}>): string {
  const set = new Set<string>();
  data.forEach(item => {
    for (const c of item.kanji) {
      const code = c.codePointAt(0);
      if (code && code >= 0x4E00 && code <= 0x9FFF) {
        set.add(c);
      }
    }
  });
  return [...set].join('');
}

export const GRADE_5_KANJI = extractKanjiFromJson(grade5Data);
export const GRADE_6_KANJI = extractKanjiFromJson(grade6Data);

// 既存の getKanjiUpToGrade と isKanjiUpToGrade は引数不要に簡略化
export function getKanjiUpToGrade(grade: 1|2|3|4|5|6): string {
  let r = GRADE_1_KANJI;
  if (grade >= 2) r += GRADE_2_KANJI;
  if (grade >= 3) r += GRADE_3_KANJI;
  if (grade >= 4) r += GRADE_4_KANJI;
  if (grade >= 5) r += GRADE_5_KANJI;
  if (grade >= 6) r += GRADE_6_KANJI;
  return r;
}
```

JSONインポートのため、tsconfig.json に
"resolveJsonModule": true が必要なら追加してください。

==========================================
2. recognizer.ts の改善
==========================================

【現状】
- 候補数が3件固定
- 信頼度スコアが固定値(1.0, 0.85, 0.70)

【改善A: 候補数の動的調整】
KanjiCanvas からの戻り値を見て、以下のロジックで候補数を決める:
- 1位の生スコアが2位より大きく上回る(明確な1位) → 上位3件
- スコアが拮抗している(似た字で迷っている) → 上位8〜10件

実装方法は recognizer.ts 内で完結。
KanjiCanvas の生スコア形式が確認できなければ、
ひとまず「常に8件返す」でOK。
候補数の上限は定数として MAX_CANDIDATES = 8 のように定義。

【改善B: 学年フィルタ】
recognizeKanji に gradeLimit?: 1|2|3|4|5|6 オプションを追加:
- gradeLimit が指定されたら、その学年までの累積配当漢字でフィルタ
- src/data/grade-kanji-list.ts の getKanjiUpToGrade を使う
- フィルタ後に候補が0件になる場合は、フィルタを外して全体から返す
  (最後の救済策)

==========================================
3. 呼び出し側の対応
==========================================

QuizWritingPage.tsx と QuizReadingPage.tsx で、
現在の問題の grade を recognizeKanji に渡す。
例: recognizeKanji(strokes, { gradeLimit: question.grade })

==========================================
4. フォールバック自動切替
==========================================

【現状】
認識結果が0件のとき、お子さんが手動で「キーボード」ボタンを押す必要あり。

【改善】
- recognizeKanji の結果が0件 → 「認識できませんでした」と
  優しく表示し、「キーボードで入力する」ボタンを目立たせる
- 同じマスで2回連続で認識失敗 → 自動でキーボード入力モードに切替
- 切替時、対象のマスにフォーカスを移動

【UI】
小さなトースト or マス上部の小さな帯で
「認識できませんでした。もう一度書くか、キーボードを使えます」
のようなメッセージ。優しい口調で。

==========================================
動作確認のポイント
==========================================
- 「講」「績」「識」のような複雑な漢字を書いたとき、候補に正解が
  出てくる確率が上がっているか
- 学年フィルタで関係ない字(中学校以降の漢字)が混ざらないか
- 認識失敗時のフォールバックが優しく出るか

==========================================
完了後のレポート
==========================================
- 修正したファイル一覧
- 候補数の動的調整ロジックの説明(短く)
- 学年フィルタの実装概要(短く)
- フォールバックUIの動作概要(短く)
- 自己チェックで気づいた点があれば(数件以内)

【再強調】
- レポートには漢字を大量に書き出さないでください
- 数字とOK/NGで簡潔に報告してください
- kanji-canvas.min.js と ref-patterns.js は読まないでください
