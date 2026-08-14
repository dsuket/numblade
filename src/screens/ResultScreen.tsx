interface ResultScreenProps {
  correctAnswered: number
  questionsAnswered: number
  maxCombo: number
  score: number
  highScore: number
  onRestart: () => void
}

export default function ResultScreen({
  correctAnswered,
  questionsAnswered,
  maxCombo,
  score,
  highScore,
  onRestart,
}: ResultScreenProps) {
  const accuracy = questionsAnswered === 0 ? 0 : Math.round((correctAnswered / questionsAnswered) * 100)

  return (
    <div className="flex flex-col items-center gap-2 text-[#e6f1ff]">
      <div className="relative flex items-center justify-center">
        <span
          data-testid="explosion"
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center text-6xl animate-[explode_0.6s_ease-out_forwards]"
        >
          💥
        </span>
        <div className="text-6xl" aria-hidden="true">
          🏆
        </div>
      </div>
      <h2 className="text-4xl font-bold text-[#ffd166] drop-shadow-[0_0_12px_#ffd166] tracking-wider">
        ゲームクリア！
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
