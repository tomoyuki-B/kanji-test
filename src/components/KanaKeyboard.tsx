interface Props {
  value: string
  onChange: (v: string) => void
  maxLength: number
}

const ROWS = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', '　', 'ゆ', '　', 'よ'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['わ', '　', 'を', '　', 'ん'],
  ['っ', 'ー', '゛', '゜', ''],
]

export default function KanaKeyboard({ value, onChange, maxLength }: Props) {
  const handleTap = (char: string) => {
    if (!char.trim()) return
    if (value.length >= maxLength) return
    onChange(value + char)
  }

  const handleDelete = () => {
    onChange(value.slice(0, -1))
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md">
      {/* 入力プレビュー */}
      <div className="flex gap-2 mb-2">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className="w-12 h-12 border-b-2 border-green-400 flex items-end justify-center text-2xl font-bold text-gray-800"
          >
            {value[i] ?? ''}
          </div>
        ))}
      </div>

      {/* キー配列 */}
      <div className="grid gap-1 w-full">
        {ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1 justify-center">
            {row.map((char, ci) => (
              <button
                key={ci}
                onClick={() => handleTap(char)}
                disabled={!char.trim()}
                className="w-14 h-11 bg-white border border-gray-300 rounded-lg text-xl font-bold text-gray-700
                  hover:bg-green-50 active:bg-green-100 disabled:invisible"
              >
                {char.trim() || ''}
              </button>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={handleDelete}
        className="px-6 py-3 bg-red-100 text-red-700 font-bold rounded-xl min-h-[44px] text-lg"
      >
        ← 消す
      </button>
    </div>
  )
}
