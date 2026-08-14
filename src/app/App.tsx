import { useReducer } from 'react'
import { ENEMY_SEQUENCE } from '../game/battle'
import { gameReducer, initGameState } from '../game/reducer'
import BattleScreen from '../screens/BattleScreen'
import ResultScreen from '../screens/ResultScreen'
import TitleScreen from '../screens/TitleScreen'

const APP_CLASS =
  'min-h-screen flex items-center justify-center bg-[#0a0e1a] text-[#e6f1ff] font-[system-ui,sans-serif]'

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, initGameState)

  if (state.screen === 'title') {
    return (
      <div className={APP_CLASS}>
        <TitleScreen highScore={state.highScore} onStart={() => dispatch({ type: 'START' })} />
      </div>
    )
  }

  if (state.screen === 'battle' && state.enemy && state.question) {
    const isBoss = ENEMY_SEQUENCE[state.segmentIndex].isBoss
    return (
      <div className={APP_CLASS}>
        <BattleScreen
          enemy={state.enemy}
          question={state.question}
          combo={state.combo}
          score={state.score}
          isBoss={isBoss}
          lastAnswerCorrect={state.lastAnswerCorrect}
          battleMessage={state.battleMessage}
          onAnswer={(value) => dispatch({ type: 'ANSWER', value })}
        />
      </div>
    )
  }

  return (
    <div className={APP_CLASS}>
      <ResultScreen
        correctAnswered={state.correctAnswered}
        questionsAnswered={state.questionsAnswered}
        maxCombo={state.maxCombo}
        score={state.score}
        highScore={state.highScore}
        onRestart={() => dispatch({ type: 'RESTART' })}
      />
    </div>
  )
}
