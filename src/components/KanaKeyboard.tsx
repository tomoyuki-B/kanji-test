interface Props {
  onInput: (char: string) => void
  onDelete: () => void
}

const ROWS = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', '', 'ゆ', '', 'よ'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['わ', '', 'を', '', 'ん'],
  ['っ', 'ー', '゛', '゜', ''],
]

export default function KanaKeyboard({ onInput, onDelete }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-sm">
      <div className="flex flex-col gap-1 w-full">
        {ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1 justify-center">
            {row.map((char, ci) => (
              <button
                key={ci}
                onClick={() => char && onInput(char)}
                disabled={!char}
                className="w-14 h-11 bg-white border border-gray-300 rounded-lg text-xl font-bold text-gray-700
                  hover:bg-violet-50 active:bg-violet-100 disabled:invisible"
              >
                {char}
              </button>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={onDelete}
        className="px-8 py-3 bg-red-50 border border-red-200 text-red-600 font-bold rounded-xl min-h-[48px] text-lg"
      >
        ← 消す
      </button>
    </div>
  )
}
