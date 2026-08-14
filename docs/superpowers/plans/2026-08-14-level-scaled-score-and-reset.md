# レベル反映スコア計算 & レベルリセットボタン Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make score scale up with the player's difficulty level, and add a title-screen button that resets the persisted level back to the minimum.

**Architecture:** A pure `levelFactor(level)` function in `scoring.ts` maps `DifficultyLevel` (1–6) to a multiplier (1.0–3.0), which `scoreForAnswer` folds into its existing combo/speed-multiplier calculation. The reducer passes the level in effect at answer time (before this answer's own adaptive level change is applied). A new `RESET_LEVEL` reducer action sets `level` back to `MIN_LEVEL` and persists it via the existing `saveProgress` helper; a title-screen button (visible only above `MIN_LEVEL`) dispatches it.

**Tech Stack:** TypeScript, React, Vitest, @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-08-14-level-scaled-score-and-reset-design.md`

## Global Constraints

- `levelFactor(level) = 1 + (level - 1) * 0.4` — level 1 → 1.0, level 6 (MAX_LEVEL) → 3.0.
- Score uses the level **in effect when the question was asked** (i.e. `state.level` before this answer's `nextLevel()` update), never the post-answer level.
- `RESET_LEVEL` resets only `level` to `MIN_LEVEL`; `highScore` is untouched.
- The reset-level button is shown only when `level > MIN_LEVEL`, and only on the title screen. No confirmation dialog.
- Damage calculation (`damagePerCorrectAnswer`) is unaffected — the level factor applies to score only.
- All UI copy is Japanese; code comments are English, matching the existing codebase.

---

### Task 1: Add `levelFactor` and fold it into `scoreForAnswer`

**Files:**
- Modify: `src/game/scoring.ts`
- Modify: `src/game/scoring.test.ts`

**Interfaces:**
- Produces: `levelFactor(level: DifficultyLevel): number`
- Produces (signature change): `scoreForAnswer(combo: number, multiplier: number, level: DifficultyLevel): number` — was `scoreForAnswer(combo: number, multiplier: number): number`. Every caller must now pass a third `level` argument.

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `src/game/scoring.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { bonusTierForElapsed, levelFactor, multiplierForTier, nextCombo, scoreForAnswer } from './scoring'

describe('nextCombo', () => {
  it('increments combo by 1 on correct answer', () => {
    expect(nextCombo(2, true)).toBe(3)
  })

  it('resets combo to 0 on incorrect answer', () => {
    expect(nextCombo(5, false)).toBe(0)
  })
})

describe('bonusTierForElapsed', () => {
  it('returns critical at exactly 5000ms', () => {
    expect(bonusTierForElapsed(5000)).toBe('critical')
  })

  it('returns critical below 5000ms', () => {
    expect(bonusTierForElapsed(0)).toBe('critical')
    expect(bonusTierForElapsed(4999)).toBe('critical')
  })

  it('returns nice just above 5000ms', () => {
    expect(bonusTierForElapsed(5001)).toBe('nice')
  })

  it('returns nice at exactly 10000ms', () => {
    expect(bonusTierForElapsed(10000)).toBe('nice')
  })

  it('returns null just above 10000ms', () => {
    expect(bonusTierForElapsed(10001)).toBe(null)
  })

  it('returns null for any elapsed time up to the 20s timeout', () => {
    expect(bonusTierForElapsed(19999)).toBe(null)
  })
})

describe('multiplierForTier', () => {
  it('returns 1.5 for critical', () => {
    expect(multiplierForTier('critical')).toBe(1.5)
  })

  it('returns 1.2 for nice', () => {
    expect(multiplierForTier('nice')).toBe(1.2)
  })

  it('returns 1 for null (no bonus)', () => {
    expect(multiplierForTier(null)).toBe(1)
  })
})

describe('levelFactor', () => {
  it('returns 1.0 at level 1 (no bonus)', () => {
    expect(levelFactor(1)).toBe(1)
  })

  it('increases by 0.4 per level', () => {
    expect(levelFactor(2)).toBe(1.4)
    expect(levelFactor(3)).toBe(1.8)
    expect(levelFactor(4)).toBe(2.2)
    expect(levelFactor(5)).toBe(2.6)
  })

  it('returns 3.0 at the max level (6)', () => {
    expect(levelFactor(6)).toBe(3)
  })
})

describe('scoreForAnswer', () => {
  it('awards the base 100 points with no milestone and no multiplier, at level 1', () => {
    expect(scoreForAnswer(1, 1, 1)).toBe(100)
    expect(scoreForAnswer(2, 1, 1)).toBe(100)
    expect(scoreForAnswer(4, 1, 1)).toBe(100)
  })

  it('adds a +50 bonus exactly at 3-combo', () => {
    expect(scoreForAnswer(3, 1, 1)).toBe(150)
  })

  it('adds a +100 bonus exactly at 5-combo', () => {
    expect(scoreForAnswer(5, 1, 1)).toBe(200)
  })

  it('adds a +300 bonus exactly at 10-combo', () => {
    expect(scoreForAnswer(10, 1, 1)).toBe(400)
  })

  it('scales the total by the speed multiplier and rounds', () => {
    expect(scoreForAnswer(1, 1.5, 1)).toBe(150)
    expect(scoreForAnswer(1, 1.2, 1)).toBe(120)
    expect(scoreForAnswer(3, 1.5, 1)).toBe(225) // (100 + 50) * 1.5
  })

  it('scales the total by the level factor', () => {
    expect(scoreForAnswer(1, 1, 3)).toBe(180) // 100 * 1.8
    expect(scoreForAnswer(1, 1, 6)).toBe(300) // 100 * 3.0
  })

  it('combines the speed multiplier and the level factor', () => {
    expect(scoreForAnswer(1, 1.5, 6)).toBe(450) // 100 * 1.5 * 3.0
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/game/scoring.test.ts`
Expected: FAIL — `levelFactor` is not exported, and the `scoreForAnswer` calls with a 3rd argument don't match the current 2-argument signature (TypeScript type error surfaced by vitest's esbuild transform, or a `TS2345`-style failure depending on how it's run; at minimum the new `levelFactor` tests fail with "levelFactor is not a function").

- [ ] **Step 3: Implement `levelFactor` and update `scoreForAnswer`**

Replace the full contents of `src/game/scoring.ts` with:

```ts
import type { DifficultyLevel } from './difficulty'

const COMBO_BONUS: Record<number, number> = {
  3: 50,
  5: 100,
  10: 300,
}

export function nextCombo(current: number, correct: boolean): number {
  return correct ? current + 1 : 0
}

export type BonusTier = 'critical' | 'nice' | null

// elapsedMs is the time between a question appearing and the player
// answering it. <=5s is a "critical" bonus, <=10s is a "nice" bonus,
// anything slower (up to the 20s auto-miss) gets no bonus.
export function bonusTierForElapsed(elapsedMs: number): BonusTier {
  if (elapsedMs <= 5000) return 'critical'
  if (elapsedMs <= 10000) return 'nice'
  return null
}

export function multiplierForTier(tier: BonusTier): number {
  if (tier === 'critical') return 1.5
  if (tier === 'nice') return 1.2
  return 1
}

// level=1 is 1.0x; each level above that adds 0.4x, so level=6 (MAX_LEVEL)
// is 3.0x. Rewards playing at a higher difficulty with a bigger score.
export function levelFactor(level: DifficultyLevel): number {
  return 1 + (level - 1) * 0.4
}

// Base +100 per correct answer, plus a one-time milestone bonus the exact
// moment combo reaches 3 / 5 / 10 (spec section 3.4), scaled by the speed
// bonus multiplier and the level factor, and rounded to the nearest point.
export function scoreForAnswer(combo: number, multiplier: number, level: DifficultyLevel): number {
  return Math.round((100 + (COMBO_BONUS[combo] ?? 0)) * multiplier * levelFactor(level))
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/game/scoring.test.ts`
Expected: PASS (all tests in the file)

- [ ] **Step 5: Commit**

```bash
git add src/game/scoring.ts src/game/scoring.test.ts
git commit -m "feat: scale score by difficulty level"
```

---

### Task 2: Wire the level into the reducer's score calculation

**Files:**
- Modify: `src/game/reducer.ts:130`
- Modify: `src/game/reducer.test.ts:182`

**Interfaces:**
- Consumes: `scoreForAnswer(combo: number, multiplier: number, level: DifficultyLevel): number` from Task 1.

- [ ] **Step 1: Update the existing score assertion to the new expected value**

In `src/game/reducer.test.ts`, find the test `'finishes the game after all 10 questions answered correctly, with combo-bonus score'` (around line 174) and change:

```ts
    expect(state.score).toBe(1450)
```

to:

```ts
    // With the level factor applied: answers 1-3 at level 1 (x1.0), 4-6 at
    // level 2 (x1.4), 7-9 at level 3 (x1.8), 10 at level 4 (x2.2) — the
    // adaptive rule bumps the level once per 3-correct streak.
    // 100+100+150 + 140+280+140 + 180+180+180 + 880 = 2330
    expect(state.score).toBe(2330)
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/game/reducer.test.ts -t "finishes the game after all 10 questions"`
Expected: FAIL — actual score will not be `2330` (the reducer still calls `scoreForAnswer` with only 2 arguments, so `level` is `undefined` and the result is `NaN`, or some other stale value depending on how the missing argument is handled at runtime).

- [ ] **Step 3: Pass the level into `scoreForAnswer`**

In `src/game/reducer.ts`, in the `answer()` function (around line 130), change:

```ts
  const score = state.score + scoreForAnswer(combo, multiplier)
```

to:

```ts
  const score = state.score + scoreForAnswer(combo, multiplier, state.level)
```

`state.level` here is deliberately the pre-answer level — it's read before `nextLevel()` is computed a few lines below, so it reflects the difficulty the just-answered question was actually generated at.

- [ ] **Step 4: Run the full reducer test suite to verify it passes**

Run: `npx vitest run src/game/reducer.test.ts`
Expected: PASS (all tests in the file, including the updated `2330` assertion and the untouched speed-bonus tests, which all run at level 1 where `levelFactor` is 1.0 and are unaffected)

- [ ] **Step 5: Commit**

```bash
git add src/game/reducer.ts src/game/reducer.test.ts
git commit -m "feat: score correct answers using the level in effect at answer time"
```

---

### Task 3: Add the `RESET_LEVEL` action

**Files:**
- Modify: `src/game/reducer.ts`
- Modify: `src/game/reducer.test.ts`

**Interfaces:**
- Produces: `GameAction` union gains `{ type: 'RESET_LEVEL' }`. `gameReducer(state, { type: 'RESET_LEVEL' })` returns a `GameState` with `level: MIN_LEVEL` (and `highScore` unchanged) when `state.screen === 'title'`, otherwise returns `state` unchanged.

- [ ] **Step 1: Write the failing tests**

In `src/game/reducer.test.ts`, add a new `describe` block right before the final closing `})` of the outer `describe('gameReducer', ...)` (i.e. after the `TIMEOUT` describe block, still inside `gameReducer`'s describe):

```ts
  describe('RESET_LEVEL', () => {
    it('resets the level to MIN_LEVEL and persists it, without touching highScore', () => {
      saveProgress({ level: 5, highScore: 900 })
      const state = initGameState()
      expect(state.level).toBe(5)

      const result = gameReducer(state, { type: 'RESET_LEVEL' })
      expect(result.level).toBe(1)
      expect(result.highScore).toBe(900)

      const reloaded = initGameState()
      expect(reloaded.level).toBe(1)
      expect(reloaded.highScore).toBe(900)
    })

    it('is a no-op outside the title screen', () => {
      const battleState = gameReducer(initGameState(), { type: 'START' })
      expect(gameReducer(battleState, { type: 'RESET_LEVEL' })).toEqual(battleState)
    })
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/game/reducer.test.ts -t "RESET_LEVEL"`
Expected: FAIL — `'RESET_LEVEL'` is not a valid `GameAction`, so `gameReducer` falls through to its `default: return state` branch and `result.level` stays `5` instead of becoming `1`.

- [ ] **Step 3: Add the action and reducer function**

In `src/game/reducer.ts`, update the import from `./difficulty` (line 2) to also bring in `MIN_LEVEL`:

```ts
import { getLevelParams, MIN_LEVEL, nextLevel, type DifficultyLevel } from './difficulty'
```

Add `RESET_LEVEL` to the `GameAction` union (around line 30-35):

```ts
export type GameAction =
  | { type: 'START' }
  | { type: 'ANSWER'; value: number; elapsedMs: number }
  | { type: 'TIMEOUT' }
  | { type: 'CONTINUE' }
  | { type: 'RESTART' }
  | { type: 'RESET_LEVEL' }
```

Add a new `resetLevel` function, next to the other screen-transition functions (e.g. right after `continueAfterDefeat`, before `gameReducer`):

```ts
function resetLevel(state: GameState): GameState {
  if (state.screen !== 'title') return state
  const level = MIN_LEVEL
  saveProgress({ level, highScore: state.highScore })
  return { ...state, level }
}
```

Add the case to the `gameReducer` switch:

```ts
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      return startBattle(state)
    case 'ANSWER':
      return answer(state, action.value, action.elapsedMs)
    case 'TIMEOUT':
      return timeout(state)
    case 'CONTINUE':
      return continueAfterDefeat(state)
    case 'RESTART':
      return startBattle(state)
    case 'RESET_LEVEL':
      return resetLevel(state)
    default:
      return state
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/game/reducer.test.ts`
Expected: PASS (all tests in the file)

- [ ] **Step 5: Commit**

```bash
git add src/game/reducer.ts src/game/reducer.test.ts
git commit -m "feat: add RESET_LEVEL action to reset the difficulty level"
```

---

### Task 4: Add the reset-level button to `TitleScreen`

**Files:**
- Modify: `src/screens/TitleScreen.tsx`
- Create: `src/screens/TitleScreen.test.tsx`

**Interfaces:**
- Consumes: `MIN_LEVEL: DifficultyLevel` and `type DifficultyLevel` from `../game/difficulty` (already used elsewhere in the codebase, e.g. `src/game/reducer.ts`).
- Produces (signature change): `TitleScreen` now requires `level: DifficultyLevel` and `onResetLevel: () => void` props, in addition to the existing `highScore: number` and `onStart: () => void`.

- [ ] **Step 1: Write the failing tests**

Create `src/screens/TitleScreen.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TitleScreen from './TitleScreen'

describe('TitleScreen', () => {
  it('shows the title and start button', () => {
    render(<TitleScreen level={1} highScore={0} onStart={() => {}} onResetLevel={() => {}} />)
    expect(screen.getByText('NUMBLADE')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'スタート' })).toBeInTheDocument()
  })

  it('calls onStart when the start button is clicked', () => {
    const onStart = vi.fn()
    render(<TitleScreen level={1} highScore={0} onStart={onStart} onResetLevel={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('does not show the reset-level button at the minimum level', () => {
    render(<TitleScreen level={1} highScore={0} onStart={() => {}} onResetLevel={() => {}} />)
    expect(screen.queryByRole('button', { name: 'レベルをリセット' })).not.toBeInTheDocument()
  })

  it('shows the reset-level button above the minimum level and calls onResetLevel when clicked', () => {
    const onResetLevel = vi.fn()
    render(<TitleScreen level={3} highScore={0} onStart={() => {}} onResetLevel={onResetLevel} />)
    const button = screen.getByRole('button', { name: 'レベルをリセット' })
    fireEvent.click(button)
    expect(onResetLevel).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/screens/TitleScreen.test.tsx`
Expected: FAIL — `TitleScreen` doesn't accept a `level` or `onResetLevel` prop yet, and no "レベルをリセット" button exists.

- [ ] **Step 3: Add the `level` prop and the reset-level button**

Replace the full contents of `src/screens/TitleScreen.tsx` with:

```tsx
import { MIN_LEVEL, type DifficultyLevel } from '../game/difficulty'

interface TitleScreenProps {
  level: DifficultyLevel
  highScore: number
  onStart: () => void
  onResetLevel: () => void
}

export default function TitleScreen({ level, highScore, onStart, onResetLevel }: TitleScreenProps) {
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
      {level > MIN_LEVEL && (
        <button
          type="button"
          className="min-h-10 min-w-[160px] rounded-xl border border-[#3a86ff] bg-transparent text-sm text-[#3a86ff] cursor-pointer"
          onClick={onResetLevel}
        >
          レベルをリセット
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/screens/TitleScreen.test.tsx`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/screens/TitleScreen.tsx src/screens/TitleScreen.test.tsx
git commit -m "feat: add a reset-level button to the title screen"
```

---

### Task 5: Wire `RESET_LEVEL` from `App`

**Files:**
- Modify: `src/app/App.tsx:86-92`
- Modify: `src/app/App.test.tsx`

**Interfaces:**
- Consumes: `TitleScreen` props from Task 4 (`level`, `onResetLevel`); `GameAction` `{ type: 'RESET_LEVEL' }` from Task 3.

- [ ] **Step 1: Write the failing test**

In `src/app/App.test.tsx`, add a new import line alongside the existing ones at the top of the file:

```ts
import { saveProgress } from '../storage/gameStorage'
```

Add this test inside `describe('App', ...)`, e.g. right after the `'starts the battle after clicking the start button'` test:

```tsx
  it('resets the level from the title screen and the button disappears once the level is back to the minimum', () => {
    saveProgress({ level: 4, highScore: 0 })
    render(<App />)

    const resetButton = screen.getByRole('button', { name: 'レベルをリセット' })
    fireEvent.click(resetButton)

    expect(screen.queryByRole('button', { name: 'レベルをリセット' })).not.toBeInTheDocument()
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/app/App.test.tsx -t "resets the level from the title screen"`
Expected: FAIL — `TitleScreen` is rendered from `App.tsx` without a `level` or `onResetLevel` prop, so no "レベルをリセット" button is ever rendered and `screen.getByRole` throws.

- [ ] **Step 3: Pass `level` and `onResetLevel` from `App`**

In `src/app/App.tsx`, change the `title` screen block (around line 86-92) from:

```tsx
  if (state.screen === 'title') {
    return (
      <div className={APP_CLASS}>
        <TitleScreen highScore={state.highScore} onStart={() => dispatch({ type: 'START' })} />
      </div>
    )
  }
```

to:

```tsx
  if (state.screen === 'title') {
    return (
      <div className={APP_CLASS}>
        <TitleScreen
          level={state.level}
          highScore={state.highScore}
          onStart={() => dispatch({ type: 'START' })}
          onResetLevel={() => dispatch({ type: 'RESET_LEVEL' })}
        />
      </div>
    )
  }
```

- [ ] **Step 4: Run the full App test suite to verify it passes**

Run: `npx vitest run src/app/App.test.tsx`
Expected: PASS (all tests in the file)

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: PASS (every test file in the project, confirming nothing else regressed)

- [ ] **Step 6: Commit**

```bash
git add src/app/App.tsx src/app/App.test.tsx
git commit -m "feat: wire the title-screen reset-level button to the reducer"
```
