import { useReducer } from 'react'
import { ENEMY_SEQUENCE } from '../game/battle'
import { gameReducer, initGameState } from '../game/reducer'
import BattleScreen from '../screens/BattleScreen'
import ResultScreen from '../screens/ResultScreen'
import TitleScreen from '../screens/TitleScreen'
import './App.css'

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, initGameState)

  if (state.screen === 'title') {
    return (
      <div className="app">
        <TitleScreen highScore={state.highScore} onStart={() => dispatch({ type: 'START' })} />
      </div>
    )
  }

  if (state.screen === 'battle' && state.enemy && state.question) {
    const isBoss = ENEMY_SEQUENCE[state.segmentIndex].isBoss
    return (
      <div className="app">
        <BattleScreen
          enemy={state.enemy}
          question={state.question}
          combo={state.combo}
          score={state.score}
          isBoss={isBoss}
          onAnswer={(value) => dispatch({ type: 'ANSWER', value })}
        />
      </div>
    )
  }

  return (
    <div className="app">
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
