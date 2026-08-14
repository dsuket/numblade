interface GameOverScreenProps {
  correctAnswered: number
  questionsAnswered: number
  maxCombo: number
  score: number
  highScore: number
  onRestart: () => void
}

export default function GameOverScreen({
  correctAnswered,
  questionsAnswered,
  maxCombo,
  score,
  highScore,
  onRestart,
}: GameOverScreenProps) {
  const accuracy = questionsAnswered === 0 ? 0 : Math.round((correctAnswered / questionsAnswered) * 100)

  return (
    <div className="flex flex-col items-center gap-2 text-[#e6f1ff]">
      <div className="text-6xl" aria-hidden="true">
        💀
      </div>
      <h2 className="text-4xl font-bold text-[#ff4d6d] drop-shadow-[0_0_12px_#ff4d6d] tracking-wider">
        ゲームオーバー
      </h2>
      <p className="text-sm text-[#e6f1ff]/70 mb-2">リザルト</p>
      <p>
        正答数: {correctAnswered} / {questionsAnswered}
      </p>
      <p>正答率: {accuracy}%</p>
      <p>最大コンボ: {maxCombo}</p>
      <p className="text-2xl font-bold text-[#ffd166]">スコア: {score}</p>
      <p>ハイスコア: {highScore}</p>
      <button
        type="button"
        className="min-h-16 min-w-[200px] rounded-xl border-none bg-[#3a86ff] text-xl text-white cursor-pointer mt-4"
        onClick={onRestart}
      >
        もう一度
      </button>
    </div>
  )
}
