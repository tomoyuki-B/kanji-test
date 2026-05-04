// 学年別漢字配当表(平成29年告示・現行)
export const GRADE_1_KANJI = "一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男竹中虫町天田土二日入年白八百文木本名目立力林六";
export const GRADE_2_KANJI = "引羽雲園遠何科夏家歌画回会海絵外角楽活間丸岩顔汽記帰弓牛魚京強教近兄形計元言原戸古午後語工公広交光考行高黄合谷国黒今才細作算止市矢姉思紙寺自時室社弱首秋週春書少場色食心新親図数西声星晴切雪船線前組走多太体台地池知茶昼長鳥朝直通弟店点電刀冬当東答頭同道読内南肉馬売買麦半番父風分聞米歩母方北毎妹万明鳴毛門夜野友用曜来里理話";
export const GRADE_3_KANJI = "悪安暗医委意育員院飲運泳駅央横屋温化荷開界階寒感漢館岸起期客究急級宮球去橋業曲局銀区苦具君係軽血決研県庫湖向幸港号根祭皿仕死使始指歯詩次事持式実写者主守取酒受州拾終習集住重宿所暑助昭消商章勝乗植申身神真深進世整昔全相送想息速族他打対待代第題炭短談着注柱丁帳調追定庭笛鉄転都度投豆島湯登等動童農波配倍箱畑発反坂板皮悲美鼻筆氷表秒病品負部服福物平返勉放味命面問役薬由油有遊予羊洋葉陽様落流旅両緑礼列練路和";
export const GRADE_4_KANJI = "愛案以衣位茨印英栄媛塩岡億加果貨課芽賀改械害街各覚潟完官管関観願岐希季旗器機議求泣給挙漁共協鏡競極熊訓軍郡群径景芸欠結建健験固功好香候康佐差菜最埼材崎昨札刷察参産散残氏司試児治滋辞鹿失借種周祝順初松笑唱焼照城縄臣信井成省清静席積折節説浅戦選然争倉巣束側続卒孫帯隊達単置仲沖兆低底的典伝徒努灯働特徳栃奈梨熱念敗梅博阪飯飛必票標不夫付府阜富副兵別辺変便包法望牧末満未民無約勇要養浴利陸良料量輪類令冷例連老労録";

// 5・6年生の配当漢字は kanji-grade5.json / kanji-grade6.json から
// 動的に抽出する設計のため、ここでは定義しない。
// 呼び出し側で抽出した文字列を引数として渡す。

export function getKanjiUpToGrade(
  grade: 1 | 2 | 3 | 4 | 5 | 6,
  grade5: string = "",
  grade6: string = "",
): string {
  let result = GRADE_1_KANJI;
  if (grade >= 2) result += GRADE_2_KANJI;
  if (grade >= 3) result += GRADE_3_KANJI;
  if (grade >= 4) result += GRADE_4_KANJI;
  if (grade >= 5) result += grade5;
  if (grade >= 6) result += grade6;
  return result;
}

export function isKanjiUpToGrade(
  char: string,
  grade: 1 | 2 | 3 | 4 | 5 | 6,
  grade5: string = "",
  grade6: string = "",
): boolean {
  return getKanjiUpToGrade(grade, grade5, grade6).includes(char);
}
