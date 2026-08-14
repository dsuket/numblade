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
      <h2>リザルト</h2>
      <p>
        正答数: {correctAnswered} / {questionsAnswered}
      </p>
      <p>正答率: {accuracy}%</p>
      <p>最大コンボ: {maxCombo}</p>
      <p>スコア: {score}</p>
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
