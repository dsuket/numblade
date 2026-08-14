import './ResultScreen.css'

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
    <div className="result-screen">
      <h2>リザルト</h2>
      <p>
        正答数: {correctAnswered} / {questionsAnswered}
      </p>
      <p>正答率: {accuracy}%</p>
      <p>最大コンボ: {maxCombo}</p>
      <p>スコア: {score}</p>
      <p>ハイスコア: {highScore}</p>
      <button type="button" className="result-restart-button" onClick={onRestart}>
        もう一度
      </button>
    </div>
  )
}
