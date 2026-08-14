interface TitleScreenProps {
  highScore: number
  onStart: () => void
}

export default function TitleScreen({ highScore, onStart }: TitleScreenProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-[#e6f1ff]">
      <h1 className="text-5xl tracking-[0.1em]">NUMBLADE</h1>
      <p>数字を解け。敵を斬れ。</p>
      {highScore > 0 && <p>ハイスコア: {highScore}</p>}
      <button
        type="button"
        className="min-h-16 min-w-[200px] rounded-xl border-none bg-[#3a86ff] text-2xl text-white cursor-pointer"
        onClick={onStart}
      >
        スタート
      </button>
    </div>
  )
}
