import { useEffect, useReducer, useRef, useState } from 'react'
import { ENEMY_SEQUENCE } from '../game/battle'
import { gameReducer, initGameState } from '../game/reducer'
import type { Question } from '../game/models'
import BattleScreen from '../screens/BattleScreen'
import DefeatedScreen from '../screens/DefeatedScreen'
import ResultScreen from '../screens/ResultScreen'
import TitleScreen from '../screens/TitleScreen'

const APP_CLASS =
  'min-h-screen flex items-center justify-center bg-[#0a0e1a] text-[#e6f1ff] font-[system-ui,sans-serif]'

// How long the killing-blow slash effect stays visible before the screen
// advances to the Defeated/Result screen.
const KILLING_BLOW_LINGER_MS = 500

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, initGameState)

  const lastQuestionRef = useRef<Question | null>(state.question)
  const prevScreenRef = useRef(state.screen)
  const [lingerActive, setLingerActive] = useState(false)

  if (state.question) {
    lastQuestionRef.current = state.question
  }

  // True only on the render where the screen just flipped away from
  // 'battle' into 'defeated'/'result' — prevScreenRef hasn't been updated
  // for this render yet (that happens in the effect below, after commit).
  // This lets the killing blow's slash effect render on the very first
  // frame, before lingerActive (set asynchronously) catches up. Read only
  // here, at render time — it must never be a useEffect dependency: it is
  // true for exactly one render by construction, so an effect keyed on it
  // would have its cleanup torn down on the very next render, before any
  // timer it started gets a chance to fire.
  const justDefeated =
    (state.screen === 'defeated' || state.screen === 'result') && prevScreenRef.current === 'battle'

  useEffect(() => {
    const arrived =
      (state.screen === 'defeated' || state.screen === 'result') && prevScreenRef.current === 'battle'
    prevScreenRef.current = state.screen
    if (!arrived) return
    setLingerActive(true)
    const timer = setTimeout(() => setLingerActive(false), KILLING_BLOW_LINGER_MS)
    return () => clearTimeout(timer)
  }, [state.screen])

  if (state.screen === 'title') {
    return (
      <div className={APP_CLASS}>
        <TitleScreen highScore={state.highScore} onStart={() => dispatch({ type: 'START' })} />
      </div>
    )
  }

  const showBattleScreen = state.screen === 'battle' || justDefeated || lingerActive
  const question = state.question ?? lastQuestionRef.current

  if (showBattleScreen && state.enemy && question) {
    const isBoss = ENEMY_SEQUENCE[state.segmentIndex].isBoss
    return (
      <div className={APP_CLASS}>
        <BattleScreen
          enemy={state.enemy}
          question={question}
          level={state.level}
          combo={state.combo}
          score={state.score}
          isBoss={isBoss}
          lastAnswerCorrect={state.lastAnswerCorrect}
          battleMessage={state.battleMessage}
          onAnswer={(value) => dispatch({ type: 'ANSWER', value })}
          disabled={state.screen !== 'battle'}
        />
      </div>
    )
  }

  if (state.screen === 'defeated' && state.enemy) {
    return (
      <div className={APP_CLASS}>
        <DefeatedScreen
          enemy={state.enemy}
          message={state.battleMessage ?? ''}
          onContinue={() => dispatch({ type: 'CONTINUE' })}
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
