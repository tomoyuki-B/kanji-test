学年別漢字配当表のデータファイルを作成してください。
これは後の手書き認識改善で使う基礎データです。

==========================================
作成するファイル
==========================================
src/data/grade-kanji-list.ts (新規作成)

==========================================
内容
==========================================
平成29年告示・現行(令和2年度施行)の学年別漢字配当表に基づき、
各学年の配当漢字を文字列で持つ TypeScript モジュール。

【字数】
- 1年生: 80字
- 2年生: 160字
- 3年生: 200字
- 4年生: 202字
- 5年生: 193字
- 6年生: 191字
- 合計: 1026字

【出典】
信頼できる外部情報源(Wikipedia「学年別漢字配当表」現行版、
文部科学省 学習指導要領、または同等のサイト)から取得。
旧版(平成元年版)は使わないこと。

==========================================
TypeScript モジュールの形
==========================================

```typescript
// src/data/grade-kanji-list.ts

export const GRADE_1_KANJI = "一右雨円王...";  // 80字
export const GRADE_2_KANJI = "...";               // 160字
export const GRADE_3_KANJI = "...";               // 200字
export const GRADE_4_KANJI = "...";               // 202字
export const GRADE_5_KANJI = "...";               // 193字
export const GRADE_6_KANJI = "...";               // 191字

// 累積配当(その学年までに習った漢字すべて)
export const KANJI_UP_TO_GRADE = {
  1: GRADE_1_KANJI,
  2: GRADE_1_KANJI + GRADE_2_KANJI,
  3: GRADE_1_KANJI + GRADE_2_KANJI + GRADE_3_KANJI,
  4: GRADE_1_KANJI + GRADE_2_KANJI + GRADE_3_KANJI + GRADE_4_KANJI,
  5: GRADE_1_KANJI + GRADE_2_KANJI + GRADE_3_KANJI + GRADE_4_KANJI + GRADE_5_KANJI,
  6: GRADE_1_KANJI + GRADE_2_KANJI + GRADE_3_KANJI + GRADE_4_KANJI + GRADE_5_KANJI + GRADE_6_KANJI,
} as const;

// ある漢字が指定学年までに習うかチェック
export function isKanjiUpToGrade(char: string, grade: 1 | 2 | 3 | 4 | 5 | 6): boolean {
  return KANJI_UP_TO_GRADE[grade].includes(char);
}
```

==========================================
自己チェック(必須)
==========================================
作成後、以下を必ず確認:

1. 各学年の字数が正しいか
   - 1年:80, 2年:160, 3年:200, 4年:202, 5年:193, 6年:191
   - 合計1026字

2. 重複がないか
   - 同じ漢字が複数学年に含まれていないか
   - 各学年内で重複がないか

3. 既存JSONとの整合性
   - public/data/kanji-grade5.json の各 kanji フィールドの漢字が、
     すべて GRADE_5_KANJI に含まれるか
   - public/data/kanji-grade6.json の各 kanji フィールドの漢字が、
     すべて GRADE_6_KANJI に含まれるか
   - 不一致があれば、どの漢字が一致しないかをレポート

4. 平成29年告示版になっているか
   - 5年生に「賀、群、徳、富、恩、券、承、舌、銭、退、敵、俵、預」が
     入っていないこと
   - 6年生は191字(平成29年告示版)であること

==========================================
レポート
==========================================
- 各学年の字数の確認結果
- 重複チェックの結果
- 既存JSONとの整合性チェック結果(不一致があればリスト)
- 自己チェックで発見した問題と修正内容

【重要】 認識ロジックや UI の修正はまだ行わないでください。
データファイル作成と自己チェックだけお願いします。
