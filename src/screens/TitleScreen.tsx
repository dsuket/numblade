import './TitleScreen.css'

interface TitleScreenProps {
  highScore: number
  onStart: () => void
}

export default function TitleScreen({ highScore, onStart }: TitleScreenProps) {
  return (
    <div className="title-screen">
      <h1 className="title-logo">NUMBLADE</h1>
      <p className="title-tagline">数字を解け。敵を斬れ。</p>
      {highScore > 0 && <p className="title-highscore">ハイスコア: {highScore}</p>}
      <button type="button" className="title-start-button" onClick={onStart}>
        スタート
      </button>
    </div>
  )
}
