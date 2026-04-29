interface Props {
  onInput: (char: string) => void
  onDelete: () => void
}

// 行（列）× 段（行） — 縦にあいうえお順
// 各列: あ行 か行 さ行 た行 な行 は行 ま行 や行 ら行 わ行
const COLS = [
  ['わ', '', 'を', '', 'ん'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['や', '', 'ゆ', '', 'よ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['あ', 'い', 'う', 'え', 'お'],
]

const SPECIAL = ['っ', 'ー', '゛', '゜']

export default function KanaKeyboard({ onInput, onDelete }: Props) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {/* メイン: 5段 × 10列 */}
      <div className="flex gap-1 w-full">
        {COLS.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1 flex-1">
            {col.map((char, ri) => (
              <button
                key={ri}
                onClick={() => char && onInput(char)}
                disabled={!char}
                className="h-11 w-full bg-white border border-gray-300 rounded-md text-lg font-bold text-gray-700
                  hover:bg-violet-50 active:bg-violet-100 disabled:invisible"
              >
                {char}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* 特殊キー行 */}
      <div className="flex gap-1 w-full">
        {SPECIAL.map((char) => (
          <button
            key={char}
            onClick={() => onInput(char)}
            className="flex-1 h-11 bg-white border border-gray-300 rounded-md text-lg font-bold text-gray-600
              hover:bg-violet-50 active:bg-violet-100"
          >
            {char}
          </button>
        ))}
        <button
          onClick={onDelete}
          className="flex-1 h-11 bg-red-50 border border-red-200 text-red-600 font-bold rounded-md text-base"
        >
          ← 消す
        </button>
      </div>
    </div>
  )
}
