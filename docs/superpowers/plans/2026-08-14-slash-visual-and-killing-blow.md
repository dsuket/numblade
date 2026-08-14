# 斬撃エフェクトの見た目変更 & 撃破時の遷行タイミング調整 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 斬撃エフェクトを🗡️で右上から左下へスイープする見た目に変更し、敵を倒す止めの一撃でもエフェクトが表示されてからDefeated/Result画面に遷移するようにする。

**Architecture:** 斬撃エフェクトはCSS keyframeと絵文字の差し替えのみ。撃破時の遷行遅延は `reducer.ts` を一切変更せず、`App.tsx` 側で「直前の`question`」を`useRef`で保持し、画面がdefeated/resultに切り替わった直後も0.5秒だけ`BattleScreen`を表示し続けるロジックで実現する。

**Tech Stack:** React + TypeScript, Tailwind CSS v4, Vitest + Testing Library（fake timers）

## Global Constraints

- 斬撃エフェクトのアニメーション長・イージング（`0.35s ease-out forwards`）、`data-testid="slash-effect"`、表示条件（`lastAnswerCorrect === true`）は変更しない。
- `src/game/reducer.ts` と `src/game/reducer.test.ts` は変更しない（既存のreducerとそのテストへの影響ゼロで実現する）。
- `Enemy.tsx`, `DefeatedScreen.tsx`, `ResultScreen.tsx`, `battle.ts` は変更しない。
- 撃破直後のBattleScreen残留時間は0.5秒（`500`ms）。
- 参照spec: `docs/superpowers/specs/2026-08-14-slash-visual-and-killing-blow-design.md`

---

### Task 1: 斬撃エフェクトの絵文字とアニメーションを差し替える

**Files:**
- Modify: `src/index.css:39-52`（`slash` keyframe差し替え）
- Modify: `src/screens/BattleScreen.tsx:46`（絵文字を🗡️に変更）

**Interfaces:**
- Consumes: なし
- Produces: なし（見た目のみの変更。`data-testid="slash-effect"` や表示条件は変更しないため、他タスクはこの変更に依存しない）

この変更は絵文字とCSSアニメーションの軌道のみで、jsdom環境で検証できるロジックの変化がないため、新規の自動テストは追加しない（既存の `BattleScreen.test.tsx` はテストid・表示条件のみを検証しており、この変更で壊れない）。実装後に既存テストスイートを実行して回帰がないことを確認する。

- [ ] **Step 1: `src/index.css` の `slash` keyframe を差し替える**

`src/index.css` の既存の `@keyframes slash { ... }`（39〜52行目）を、以下に置き換える:

```css
@keyframes slash {
  0% {
    transform: translate(55%, -55%) rotate(-45deg) scale(0.7);
    opacity: 0;
  }
  30% {
    transform: translate(0, 0) rotate(-45deg) scale(1.15);
    opacity: 1;
  }
  100% {
    transform: translate(-55%, 55%) rotate(-45deg) scale(1);
    opacity: 0;
  }
}
```

- [ ] **Step 2: `src/screens/BattleScreen.tsx` の絵文字を差し替える**

`src/screens/BattleScreen.tsx` 内、`data-testid="slash-effect"` の `<span>` の中身（46行目、`⚔️`）を `🗡️` に変更する:

```tsx
        {lastAnswerCorrect === true && (
          <span
            data-testid="slash-effect"
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-6xl animate-[slash_0.35s_ease-out_forwards]"
          >
            🗡️
          </span>
        )}
```

- [ ] **Step 3: 既存テストスイートを実行し、回帰がないことを確認する**

Run: `pnpm vitest run`
Expected: 全ファイルPASS（変更前と同じ件数）

- [ ] **Step 4: コミット**

```bash
git add src/index.css src/screens/BattleScreen.tsx
git commit -m "feat: rework slash effect as a top-right to bottom-left sweep with a dagger emoji"
```

---

### Task 2: 撃破時にBattleScreenを0.5秒残留させてからDefeated/Result画面に遷移する

**Files:**
- Modify: `src/screens/BattleScreen.tsx`（`disabled?: boolean` propを追加し `QuestionPanel` に素通しする）
- Modify: `src/app/App.tsx`（撃破直後の残留ロジック）
- Test: `src/app/App.test.tsx`

**Interfaces:**
- Consumes: `QuestionPanel` の既存の `disabled?: boolean` prop（`src/components/QuestionPanel.tsx:7`、`src/components/ChoiceButton.tsx` に既に実装済み・これまで未使用だったもの）
- Produces: `BattleScreen` に新たに `disabled?: boolean` propを追加する。これは本タスク内でのみ使用する（他タスクへの影響なし）

- [ ] **Step 1: 失敗するテストを書く**

`src/app/App.test.tsx` を以下のように書き換える（既存の2テストはそのまま残し、末尾に新規テストとテスト用ヘルパーを追加する）:

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ENEMY_SEQUENCE } from '../game/battle'

// Reads the currently displayed question ("6 x 7 = ?" / "42 ÷ 6 = ?"),
// computes the correct answer, and clicks the matching choice button.
function answerCorrectly() {
  const exprEl = screen.getByText(/=\s*\?/)
  const expr = exprEl.textContent!.replace(/\s*=\s*\?$/, '').trim()
  const [aStr, op, bStr] = expr.split(' ')
  const a = Number(aStr)
  const b = Number(bStr)
  const answer = op === 'x' ? a * b : a / b
  fireEvent.click(screen.getByRole('button', { name: String(answer) }))
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the title screen with a start button', () => {
    render(<App />)
    expect(screen.getByText('NUMBLADE')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'スタート' })).toBeInTheDocument()
  })

  it('starts the battle after clicking the start button', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))
    expect(screen.getByTestId('enemy')).toBeInTheDocument()
    expect(screen.getByText(/=\s*\?/)).toBeInTheDocument()
  })

  it('keeps showing the battle screen with the slash effect right after the killing blow, then switches to the defeated screen once the delay elapses', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    for (let i = 0; i < ENEMY_SEQUENCE[0].questionCount; i++) {
      answerCorrectly()
    }

    // Right after the killing blow: still the battle screen, slash showing.
    expect(screen.getByTestId('slash-effect')).toBeInTheDocument()
    expect(screen.queryByTestId('explosion')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    // After the delay: switched to the defeated screen.
    expect(screen.getByTestId('explosion')).toBeInTheDocument()
    expect(screen.queryByTestId('slash-effect')).not.toBeInTheDocument()
  })

  it('disables the choice buttons while the killing-blow slash effect is lingering', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    for (let i = 0; i < ENEMY_SEQUENCE[0].questionCount; i++) {
      answerCorrectly()
    }

    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
    }
  })
})
```

- [ ] **Step 2: テストを実行し、新規2件が失敗することを確認する**

Run: `pnpm vitest run src/app/App.test.tsx`
Expected: 既存2件はPASS、新規2件はFAIL（`slash-effect`/`explosion`のtestidが見つからない、またはボタンが`disabled`になっていない）

- [ ] **Step 3: `BattleScreen` に `disabled` propを追加する**

`src/screens/BattleScreen.tsx` の `BattleScreenProps` インターフェースに `disabled?: boolean` を追加し、関数の分割代入引数にも追加し、`QuestionPanel` に渡す:

```tsx
interface BattleScreenProps {
  enemy: EnemyModel
  question: Question
  level: number
  combo: number
  score: number
  isBoss: boolean
  lastAnswerCorrect: boolean | null
  battleMessage: string | null
  onAnswer: (value: number) => void
  disabled?: boolean
}

export default function BattleScreen({
  enemy,
  question,
  level,
  combo,
  score,
  isBoss,
  lastAnswerCorrect,
  battleMessage,
  onAnswer,
  disabled,
}: BattleScreenProps) {
```

ファイル末尾付近の `<QuestionPanel question={question} onAnswer={onAnswer} />` を以下に変更する:

```tsx
      <QuestionPanel question={question} onAnswer={onAnswer} disabled={disabled} />
```

- [ ] **Step 4: `App.tsx` に撃破時の残留ロジックを実装する**

`src/app/App.tsx` を以下の内容に置き換える:

```tsx
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
  // This is what lets the killing blow's slash effect render for at least
  // one frame before lingerActive (set asynchronously) catches up.
  const justDefeated =
    (state.screen === 'defeated' || state.screen === 'result') && prevScreenRef.current === 'battle'

  useEffect(() => {
    prevScreenRef.current = state.screen
  })

  useEffect(() => {
    if (!justDefeated) return
    setLingerActive(true)
    const timer = setTimeout(() => setLingerActive(false), KILLING_BLOW_LINGER_MS)
    return () => clearTimeout(timer)
  }, [justDefeated])

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
```

- [ ] **Step 5: テストを実行し、すべて通ることを確認する**

Run: `pnpm vitest run src/app/App.test.tsx`
Expected: 全4件PASS

- [ ] **Step 6: 全体テストスイートを実行し、既存への影響がないことを確認する**

Run: `pnpm vitest run`
Expected: 全ファイルPASS

- [ ] **Step 7: コミット**

```bash
git add src/screens/BattleScreen.tsx src/app/App.tsx src/app/App.test.tsx
git commit -m "feat: linger on the battle screen after the killing blow so the slash effect is visible before the screen transitions"
```
