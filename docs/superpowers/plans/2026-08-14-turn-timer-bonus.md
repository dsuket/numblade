# Turn Timer & Speed Bonus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-turn count-up timer with a speed bonus (Critical!/Nice!) that scales score and enemy damage, plus an automatic 20-second timeout that damages the player like a normal wrong answer.

**Architecture:** The reducer (`src/game/reducer.ts`) stays pure — it receives `elapsedMs` as part of the `ANSWER` action and a separate `TIMEOUT` action, and computes bonus tiers from data passed in, never from a live clock. `src/app/App.tsx` owns all wall-clock behavior (an interval for the timer display, a timeout for the 20-second auto-miss), mirroring the existing killing-blow-linger pattern already in that file.

**Tech Stack:** React 18 + TypeScript, Vitest + Testing Library, vitest fake timers.

## Global Constraints

- 5秒以内に正解 → スコア・敵ダメージともに ×1.5、エフェクト文言 "Critical!"
- 10秒以内に正解 → スコア・敵ダメージともに ×1.2、エフェクト文言 "Nice!"
- 10〜20秒で正解 → 等倍（ボーナスなし、エフェクトなし）
- 境界値は「以下」で判定（5000ms ちょうど→critical、10000ms ちょうど→nice）
- 20秒経過しても未回答 → 通常の不正解と完全に同じ挙動（コンボリセット、プレイヤーHP-1、次の問題 or ゲームオーバー）で自動的に処理する
- タイマー表示は整数秒（例: "3秒"）
- 倍率適用は正解時のみ。不正解・タイムアウトは常に等倍（現状通りスコア・ダメージ0のまま）
- スコアは `Math.round()`、ダメージは `Math.ceil()` で丸める（既存の丸め方針を踏襲）

Full design rationale: `docs/superpowers/specs/2026-08-14-turn-timer-bonus-design.md`

---

## Task 1: Bonus tier calculation in scoring.ts

**Files:**
- Modify: `src/game/scoring.ts`
- Test: `src/game/scoring.test.ts`

**Interfaces:**
- Produces: `export type BonusTier = 'critical' | 'nice' | null`
- Produces: `export function bonusTierForElapsed(elapsedMs: number): BonusTier`
- Produces: `export function multiplierForTier(tier: BonusTier): number`
- Produces (signature change): `export function scoreForAnswer(combo: number, multiplier: number): number`

- [ ] **Step 1: Write the failing tests**

Replace the contents of `src/game/scoring.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { bonusTierForElapsed, multiplierForTier, nextCombo, scoreForAnswer } from './scoring'

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

describe('scoreForAnswer', () => {
  it('awards the base 100 points with no milestone and no multiplier', () => {
    expect(scoreForAnswer(1, 1)).toBe(100)
    expect(scoreForAnswer(2, 1)).toBe(100)
    expect(scoreForAnswer(4, 1)).toBe(100)
  })

  it('adds a +50 bonus exactly at 3-combo', () => {
    expect(scoreForAnswer(3, 1)).toBe(150)
  })

  it('adds a +100 bonus exactly at 5-combo', () => {
    expect(scoreForAnswer(5, 1)).toBe(200)
  })

  it('adds a +300 bonus exactly at 10-combo', () => {
    expect(scoreForAnswer(10, 1)).toBe(400)
  })

  it('scales the total by the multiplier and rounds', () => {
    expect(scoreForAnswer(1, 1.5)).toBe(150)
    expect(scoreForAnswer(1, 1.2)).toBe(120)
    expect(scoreForAnswer(3, 1.5)).toBe(225) // (100 + 50) * 1.5
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/game/scoring.test.ts`
Expected: FAIL — `bonusTierForElapsed`/`multiplierForTier` not exported, and `scoreForAnswer` called with 2 args against a 1-arg signature (TS error) / wrong results.

- [ ] **Step 3: Implement**

Replace the contents of `src/game/scoring.ts` with:

```ts
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

// Base +100 per correct answer, plus a one-time milestone bonus the exact
// moment combo reaches 3 / 5 / 10 (spec section 3.4), scaled by the speed
// bonus multiplier and rounded to the nearest point.
export function scoreForAnswer(combo: number, multiplier: number): number {
  return Math.round((100 + (COMBO_BONUS[combo] ?? 0)) * multiplier)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/game/scoring.test.ts`
Expected: PASS (all tests green)

- [ ] **Step 5: Commit**

```bash
git add src/game/scoring.ts src/game/scoring.test.ts
git commit -m "feat: add speed bonus tier calculation to scoring"
```

---

## Task 2: Multiplier support in damagePerCorrectAnswer

**Files:**
- Modify: `src/game/battle.ts`
- Test: `src/game/battle.test.ts`

**Interfaces:**
- Consumes: nothing new from Task 1 (independent of `scoring.ts`, but same multiplier convention: `1` = no bonus, `1.2` = nice, `1.5` = critical)
- Produces (signature change): `export function damagePerCorrectAnswer(segment: EnemySegment, multiplier: number): number`

- [ ] **Step 1: Write the failing test**

In `src/game/battle.test.ts`, replace the `damagePerCorrectAnswer` describe block:

```ts
describe('damagePerCorrectAnswer', () => {
  it('splits maxHp evenly across the segment question count at 1x multiplier', () => {
    for (const segment of ENEMY_SEQUENCE) {
      expect(damagePerCorrectAnswer(segment, 1) * segment.questionCount).toBeGreaterThanOrEqual(segment.maxHp)
    }
  })

  it('scales damage by the multiplier and rounds up', () => {
    const segment = { name: 'test', maxHp: 60, questionCount: 3, isBoss: false }
    expect(damagePerCorrectAnswer(segment, 1)).toBe(20)
    expect(damagePerCorrectAnswer(segment, 1.5)).toBe(30)
    expect(damagePerCorrectAnswer(segment, 1.2)).toBe(24)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/game/battle.test.ts`
Expected: FAIL — `damagePerCorrectAnswer` called with 2 args against a 1-arg signature.

- [ ] **Step 3: Implement**

In `src/game/battle.ts`, replace:

```ts
export function damagePerCorrectAnswer(segment: EnemySegment): number {
  return Math.ceil(segment.maxHp / segment.questionCount)
}
```

with:

```ts
export function damagePerCorrectAnswer(segment: EnemySegment, multiplier: number): number {
  return Math.ceil((segment.maxHp / segment.questionCount) * multiplier)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/game/battle.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/battle.ts src/game/battle.test.ts
git commit -m "feat: support a speed bonus multiplier in enemy damage"
```

---

## Task 3: ANSWER elapsedMs + TIMEOUT action in the reducer

**Files:**
- Modify: `src/game/reducer.ts`
- Test: `src/game/reducer.test.ts`

**Interfaces:**
- Consumes: `bonusTierForElapsed`, `multiplierForTier`, `scoreForAnswer(combo, multiplier)`, `type BonusTier` from `./scoring` (Task 1); `damagePerCorrectAnswer(segment, multiplier)` from `./battle` (Task 2)
- Produces: `GameAction` gains `{ type: 'ANSWER'; value: number; elapsedMs: number }` (elapsedMs now required) and `{ type: 'TIMEOUT' }`
- Produces: `GameState` gains `bonusTier: BonusTier`

- [ ] **Step 1: Write the failing tests**

In `src/game/reducer.test.ts`, update the two helper functions at the top to pass `elapsedMs`, and add new test cases. Replace the full file contents with:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { ENEMY_SEQUENCE } from './battle'
import { PLAYER_MAX_HP } from './player'
import { gameReducer, initGameState, type GameState } from './reducer'
import { saveProgress } from '../storage/gameStorage'

// 12000ms is past the 10s "nice" window, so this always resolves to no
// bonus (1x multiplier) — existing score/damage assertions in this file
// were written assuming no speed bonus and must keep holding.
const NO_BONUS_ELAPSED_MS = 12000

function playCorrectAnswer(state: GameState, elapsedMs = NO_BONUS_ELAPSED_MS): GameState {
  if (!state.question) throw new Error('no active question')
  return gameReducer(state, { type: 'ANSWER', value: state.question.answer, elapsedMs })
}

function playWrongAnswer(state: GameState): GameState {
  if (!state.question) throw new Error('no active question')
  return gameReducer(state, { type: 'ANSWER', value: state.question.answer + 1000, elapsedMs: NO_BONUS_ELAPSED_MS })
}

// Plays a correct answer and, if that defeats a non-final enemy (leaving the
// game on the "defeated" interstitial), immediately continues past it. Used
// by tests that don't care about that pause, just about reaching the next
// question.
function playCorrectAnswerAdvancing(state: GameState, elapsedMs = NO_BONUS_ELAPSED_MS): GameState {
  const next = playCorrectAnswer(state, elapsedMs)
  return next.screen === 'defeated' ? gameReducer(next, { type: 'CONTINUE' }) : next
}

describe('gameReducer', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('START moves to battle with the first enemy and a question', () => {
    const state = gameReducer(initGameState(), { type: 'START' })
    expect(state.screen).toBe('battle')
    expect(state.enemy?.maxHp).toBe(ENEMY_SEQUENCE[0].maxHp)
    expect(state.question).not.toBeNull()
    expect(state.battleMessage).toBe(`${ENEMY_SEQUENCE[0].name}があらわれた！`)
  })

  it('an incorrect answer resets combo and does not damage the enemy', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    const hpBefore = state.enemy!.hp
    state = playWrongAnswer(state)
    expect(state.combo).toBe(0)
    expect(state.enemy!.hp).toBe(hpBefore)
  })

  it('an incorrect answer reduces playerHp by 1', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    expect(state.playerHp).toBe(PLAYER_MAX_HP)
    state = playWrongAnswer(state)
    expect(state.playerHp).toBe(PLAYER_MAX_HP - 1)
  })

  it('does not end the battle or advance the segment while playerHp remains, no matter how many wrong answers are given', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    const firstEnemyId = state.enemy!.id

    for (let i = 0; i < PLAYER_MAX_HP - 1; i++) {
      state = playWrongAnswer(state)
      expect(state.screen).toBe('battle')
      expect(state.segmentIndex).toBe(0)
      expect(state.enemy!.id).toBe(firstEnemyId)
      expect(state.enemy!.hp).toBe(state.enemy!.maxHp)
      expect(state.question).not.toBeNull()
    }
  })

  it('running out of playerHp ends the game on the gameover screen', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    for (let i = 0; i < PLAYER_MAX_HP; i++) {
      state = playWrongAnswer(state)
    }
    expect(state.playerHp).toBe(0)
    expect(state.screen).toBe('gameover')
    expect(state.question).toBeNull()
  })

  it('does not persist highScore when the game ends via gameover', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    for (let i = 0; i < ENEMY_SEQUENCE[0].questionCount - 1; i++) {
      state = playCorrectAnswer(state)
    }
    for (let i = 0; i < PLAYER_MAX_HP; i++) {
      state = playWrongAnswer(state)
    }
    expect(state.screen).toBe('gameover')

    const reloaded = initGameState()
    expect(reloaded.highScore).toBe(0)
  })

  it('playerHp carries over between segments via CONTINUE but resets on START/RESTART', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    state = playWrongAnswer(state)
    expect(state.playerHp).toBe(PLAYER_MAX_HP - 1)

    for (let i = 0; i < ENEMY_SEQUENCE[0].questionCount; i++) {
      state = playCorrectAnswer(state)
    }
    expect(state.screen).toBe('defeated')
    state = gameReducer(state, { type: 'CONTINUE' })
    expect(state.playerHp).toBe(PLAYER_MAX_HP - 1)

    state = gameReducer(state, { type: 'RESTART' })
    expect(state.playerHp).toBe(PLAYER_MAX_HP)
  })

  it('shows a defeated interstitial (not the next enemy yet) right after a non-final enemy dies', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    for (let i = 0; i < ENEMY_SEQUENCE[0].questionCount - 1; i++) {
      state = playCorrectAnswer(state)
    }
    state = playCorrectAnswer(state)

    expect(state.screen).toBe('defeated')
    expect(state.segmentIndex).toBe(0)
    expect(state.enemy?.hp).toBe(0)
    expect(state.enemy?.id).toBe(ENEMY_SEQUENCE[0].name)
    expect(state.question).toBeNull()
    expect(state.battleMessage).toBe(`${ENEMY_SEQUENCE[0].name}をたおした！`)
  })

  it('CONTINUE from the defeated interstitial advances to the next enemy', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    for (let i = 0; i < ENEMY_SEQUENCE[0].questionCount; i++) {
      state = playCorrectAnswer(state)
    }
    expect(state.screen).toBe('defeated')

    state = gameReducer(state, { type: 'CONTINUE' })
    expect(state.screen).toBe('battle')
    expect(state.segmentIndex).toBe(1)
    expect(state.enemy?.maxHp).toBe(ENEMY_SEQUENCE[1].maxHp)
    expect(state.enemy?.hp).toBe(ENEMY_SEQUENCE[1].maxHp)
    expect(state.question).not.toBeNull()
    expect(state.battleMessage).toBe(`${ENEMY_SEQUENCE[1].name}があらわれた！`)
  })

  it('CONTINUE is a no-op outside the defeated screen', () => {
    const battleState = gameReducer(initGameState(), { type: 'START' })
    const afterContinue = gameReducer(battleState, { type: 'CONTINUE' })
    expect(afterContinue).toEqual(battleState)
  })

  it('clears the battle message on an ordinary answer that neither defeats nor is defeated', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    expect(state.battleMessage).not.toBeNull()
    state = playCorrectAnswer(state)
    if (ENEMY_SEQUENCE[0].questionCount > 1) {
      expect(state.battleMessage).toBeNull()
    }
  })

  it('the last enemy defeat skips the interstitial and goes straight to result', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    const totalQuestions = ENEMY_SEQUENCE.reduce((sum, s) => sum + s.questionCount, 0)
    for (let i = 0; i < totalQuestions; i++) {
      state = playCorrectAnswerAdvancing(state)
    }
    expect(state.screen).toBe('result')
  })

  it('finishes the game after all 10 questions answered correctly, with combo-bonus score', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    const totalQuestions = ENEMY_SEQUENCE.reduce((sum, s) => sum + s.questionCount, 0)
    for (let i = 0; i < totalQuestions; i++) {
      state = playCorrectAnswerAdvancing(state)
    }
    expect(state.screen).toBe('result')
    expect(state.correctAnswered).toBe(totalQuestions)
    expect(state.score).toBe(1450)
    expect(state.maxCombo).toBe(totalQuestions)
  })

  it('raises the level once per 3-correct streak, not on every subsequent answer', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    expect(state.level).toBe(1)

    for (let i = 0; i < 3; i++) {
      state = playCorrectAnswerAdvancing(state)
    }
    expect(state.level).toBe(2)

    state = playCorrectAnswerAdvancing(state)
    expect(state.level).toBe(2)
    state = playCorrectAnswerAdvancing(state)
    expect(state.level).toBe(2)

    state = playCorrectAnswerAdvancing(state)
    expect(state.level).toBe(3)
  })

  it('lowers the level once per 2-incorrect streak, not on every subsequent answer', () => {
    saveProgress({ level: 6, highScore: 0 })
    let state = gameReducer(initGameState(), { type: 'START' })
    expect(state.level).toBe(6)

    state = playWrongAnswer(state)
    state = playWrongAnswer(state)
    expect(state.level).toBe(5)

    state = playWrongAnswer(state)
    expect(state.level).toBe(5)

    state = playWrongAnswer(state)
    expect(state.level).toBe(4)
  })

  it('persists highScore to storage when the game ends', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    const totalQuestions = ENEMY_SEQUENCE.reduce((sum, s) => sum + s.questionCount, 0)
    for (let i = 0; i < totalQuestions; i++) {
      state = playCorrectAnswerAdvancing(state)
    }
    const reloaded = initGameState()
    expect(reloaded.highScore).toBe(state.score)
  })

  describe('speed bonus', () => {
    it('awards a critical (1.5x) bonus to score and enemy damage within 5 seconds', () => {
      let state = gameReducer(initGameState(), { type: 'START' })
      const enemyHpBefore = state.enemy!.hp
      state = playCorrectAnswer(state, 3000)
      expect(state.bonusTier).toBe('critical')
      expect(state.score).toBe(150) // 100 * 1.5
      const expectedDamage = Math.ceil((ENEMY_SEQUENCE[0].maxHp / ENEMY_SEQUENCE[0].questionCount) * 1.5)
      expect(enemyHpBefore - state.enemy!.hp).toBe(expectedDamage)
    })

    it('awards a nice (1.2x) bonus to score and enemy damage between 5 and 10 seconds', () => {
      let state = gameReducer(initGameState(), { type: 'START' })
      const enemyHpBefore = state.enemy!.hp
      state = playCorrectAnswer(state, 8000)
      expect(state.bonusTier).toBe('nice')
      expect(state.score).toBe(120) // 100 * 1.2
      const expectedDamage = Math.ceil((ENEMY_SEQUENCE[0].maxHp / ENEMY_SEQUENCE[0].questionCount) * 1.2)
      expect(enemyHpBefore - state.enemy!.hp).toBe(expectedDamage)
    })

    it('awards no bonus between 10 and 20 seconds', () => {
      let state = gameReducer(initGameState(), { type: 'START' })
      state = playCorrectAnswer(state, 15000)
      expect(state.bonusTier).toBe(null)
      expect(state.score).toBe(100)
    })

    it('never applies a bonus on an incorrect answer, regardless of elapsedMs', () => {
      let state = gameReducer(initGameState(), { type: 'START' })
      state = gameReducer(state, { type: 'ANSWER', value: state.question!.answer + 1000, elapsedMs: 1000 })
      expect(state.bonusTier).toBe(null)
      expect(state.score).toBe(0)
    })
  })

  describe('TIMEOUT', () => {
    it('behaves exactly like a wrong answer: resets combo and reduces playerHp by 1', () => {
      let state = gameReducer(initGameState(), { type: 'START' })
      state = playCorrectAnswer(state) // build a combo first
      expect(state.combo).toBe(1)
      const hpBeforeTimeout = state.enemy!.hp

      state = gameReducer(state, { type: 'TIMEOUT' })
      expect(state.combo).toBe(0)
      expect(state.playerHp).toBe(PLAYER_MAX_HP - 1)
      expect(state.enemy!.hp).toBe(hpBeforeTimeout) // TIMEOUT itself must deal no damage
      expect(state.lastAnswerCorrect).toBe(false)
      expect(state.bonusTier).toBe(null)
      expect(state.question).not.toBeNull()
    })

    it('ends the game on gameover when it drops playerHp to 0, same as a wrong answer', () => {
      let state = gameReducer(initGameState(), { type: 'START' })
      for (let i = 0; i < PLAYER_MAX_HP - 1; i++) {
        state = playWrongAnswer(state)
      }
      expect(state.playerHp).toBe(1)
      state = gameReducer(state, { type: 'TIMEOUT' })
      expect(state.playerHp).toBe(0)
      expect(state.screen).toBe('gameover')
      expect(state.question).toBeNull()
    })

    it('is a no-op outside the battle screen', () => {
      const titleState = initGameState()
      expect(gameReducer(titleState, { type: 'TIMEOUT' })).toEqual(titleState)
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/game/reducer.test.ts`
Expected: FAIL — `ANSWER` missing `elapsedMs` (TS error), `TIMEOUT` action type doesn't exist, `state.bonusTier` doesn't exist.

- [ ] **Step 3: Implement**

Replace the contents of `src/game/reducer.ts` with:

```ts
import { applyDamage, createEnemy, damagePerCorrectAnswer, ENEMY_SEQUENCE, isDefeated } from './battle'
import { getLevelParams, nextLevel, type DifficultyLevel } from './difficulty'
import type { Enemy, Question } from './models'
import { applyMiss, isGameOver, PLAYER_MAX_HP } from './player'
import { generateQuestion } from './questionGenerator'
import { bonusTierForElapsed, multiplierForTier, nextCombo, scoreForAnswer, type BonusTier } from './scoring'
import { loadProgress, saveProgress } from '../storage/gameStorage'

export type Screen = 'title' | 'battle' | 'defeated' | 'result' | 'gameover'

export interface GameState {
  screen: Screen
  level: DifficultyLevel
  highScore: number
  score: number
  combo: number
  maxCombo: number
  segmentIndex: number
  enemy: Enemy | null
  playerHp: number
  question: Question | null
  questionsAnswered: number
  correctAnswered: number
  recentResults: boolean[]
  lastAnswerCorrect: boolean | null
  battleMessage: string | null
  bonusTier: BonusTier
}

export type GameAction =
  | { type: 'START' }
  | { type: 'ANSWER'; value: number; elapsedMs: number }
  | { type: 'TIMEOUT' }
  | { type: 'CONTINUE' }
  | { type: 'RESTART' }

function questionForLevel(level: DifficultyLevel): Question {
  const params = getLevelParams(level)
  return generateQuestion(params.digitsA, params.digitsB, params.operation)
}

export function initGameState(): GameState {
  const stored = loadProgress()
  return {
    screen: 'title',
    level: stored?.level ?? 1,
    highScore: stored?.highScore ?? 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    segmentIndex: 0,
    enemy: null,
    playerHp: PLAYER_MAX_HP,
    question: null,
    questionsAnswered: 0,
    correctAnswered: 0,
    recentResults: [],
    lastAnswerCorrect: null,
    battleMessage: null,
    bonusTier: null,
  }
}

function startBattle(state: GameState): GameState {
  const segment = ENEMY_SEQUENCE[0]
  return {
    ...state,
    screen: 'battle',
    score: 0,
    combo: 0,
    maxCombo: 0,
    segmentIndex: 0,
    enemy: createEnemy(segment),
    playerHp: PLAYER_MAX_HP,
    question: questionForLevel(state.level),
    questionsAnswered: 0,
    correctAnswered: 0,
    recentResults: [],
    lastAnswerCorrect: null,
    battleMessage: `${segment.name}があらわれた！`,
    bonusTier: null,
  }
}

// Shared by a wrong ANSWER and an unanswered TIMEOUT — both are a miss with
// identical consequences: combo resets, playerHp drops by 1, and the battle
// either ends (gameover) or serves the next question. Never deals enemy
// damage and never awards a speed bonus.
function applyMissResult(state: GameState): GameState {
  const combo = nextCombo(state.combo, false)
  const playerHp = applyMiss(state.playerHp)
  const questionsAnswered = state.questionsAnswered + 1
  const pendingRecentResults = [...state.recentResults, false].slice(-3)
  const level = nextLevel(state.level, pendingRecentResults)
  const recentResults = level === state.level ? pendingRecentResults : []

  const base: GameState = {
    ...state,
    level,
    combo,
    playerHp,
    questionsAnswered,
    recentResults,
    lastAnswerCorrect: false,
    battleMessage: null,
    bonusTier: null,
  }

  if (isGameOver(playerHp)) {
    return { ...base, screen: 'gameover', question: null }
  }

  return { ...base, question: questionForLevel(level) }
}

function answer(state: GameState, value: number, elapsedMs: number): GameState {
  if (state.screen !== 'battle' || !state.enemy || !state.question) return state

  const correct = value === state.question.answer
  if (!correct) return applyMissResult(state)

  const segment = ENEMY_SEQUENCE[state.segmentIndex]
  const bonusTier = bonusTierForElapsed(elapsedMs)
  const multiplier = multiplierForTier(bonusTier)
  const combo = nextCombo(state.combo, true)
  const maxCombo = Math.max(state.maxCombo, combo)
  const score = state.score + scoreForAnswer(combo, multiplier)
  const enemy = applyDamage(state.enemy, damagePerCorrectAnswer(segment, multiplier))
  const questionsAnswered = state.questionsAnswered + 1
  const correctAnswered = state.correctAnswered + 1
  const pendingRecentResults = [...state.recentResults, true].slice(-3)
  const level = nextLevel(state.level, pendingRecentResults)
  const recentResults = level === state.level ? pendingRecentResults : []

  // Only a defeated enemy ends the segment — a wrong answer never ends the
  // battle by itself, it just resets combo and serves a new question.
  const segmentDone = isDefeated(enemy)
  const isLastSegment = state.segmentIndex === ENEMY_SEQUENCE.length - 1

  const base: GameState = {
    ...state,
    level,
    score,
    combo,
    maxCombo,
    enemy,
    questionsAnswered,
    correctAnswered,
    recentResults,
    lastAnswerCorrect: true,
    battleMessage: null,
    bonusTier,
  }

  if (segmentDone && isLastSegment) {
    const highScore = Math.max(state.highScore, score)
    saveProgress({ level, highScore })
    return { ...base, screen: 'result', highScore, question: null }
  }

  if (segmentDone) {
    // Pause on a "defeated" interstitial instead of jumping straight to the
    // next enemy, so the player sees the defeat before continuing.
    return {
      ...base,
      screen: 'defeated',
      question: null,
      battleMessage: `${segment.name}をたおした！`,
    }
  }

  return { ...base, question: questionForLevel(level) }
}

function timeout(state: GameState): GameState {
  if (state.screen !== 'battle' || !state.enemy || !state.question) return state
  return applyMissResult(state)
}

function continueAfterDefeat(state: GameState): GameState {
  if (state.screen !== 'defeated') return state

  const nextSegmentIndex = state.segmentIndex + 1
  const nextSegment = ENEMY_SEQUENCE[nextSegmentIndex]
  return {
    ...state,
    screen: 'battle',
    segmentIndex: nextSegmentIndex,
    enemy: createEnemy(nextSegment),
    question: questionForLevel(state.level),
    lastAnswerCorrect: null,
    battleMessage: `${nextSegment.name}があらわれた！`,
    bonusTier: null,
  }
}

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
    default:
      return state
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/game/reducer.test.ts`
Expected: PASS (all tests green)

- [ ] **Step 5: Run the full test suite to catch any other broken call sites**

Run: `pnpm vitest run`
Expected: FAIL only in `src/app/App.test.tsx` and `src/screens/BattleScreen.test.tsx` (not yet updated — handled in Tasks 4 and 5). No other files should fail.

- [ ] **Step 6: Commit**

```bash
git add src/game/reducer.ts src/game/reducer.test.ts
git commit -m "feat: apply speed bonus to answers and add TIMEOUT auto-miss action"
```

---

## Task 4: Timer display and bonus effect in BattleScreen

**Files:**
- Modify: `src/screens/BattleScreen.tsx`
- Test: `src/screens/BattleScreen.test.tsx`

**Interfaces:**
- Consumes: `type BonusTier` from `../game/scoring` (Task 1)
- Produces: `BattleScreenProps` gains optional `elapsedSeconds?: number` (default `0`) and `bonusTier?: BonusTier` (default `null`)

- [ ] **Step 1: Write the failing tests**

Add these test cases to the end of the `describe('BattleScreen', ...)` block in `src/screens/BattleScreen.test.tsx` (before the final closing `})`):

```ts
  it('shows the elapsed turn timer', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={null}
        battleMessage={null}
        onAnswer={() => {}}
        elapsedSeconds={7}
      />,
    )
    expect(screen.getByTestId('turn-timer')).toHaveTextContent('7')
  })

  it('defaults the turn timer to 0 seconds when not provided', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={null}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.getByTestId('turn-timer')).toHaveTextContent('0')
  })

  it('shows a Critical! bonus effect on a critical-tier correct answer', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={1}
        score={150}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={true}
        battleMessage={null}
        onAnswer={() => {}}
        bonusTier="critical"
      />,
    )
    expect(screen.getByTestId('bonus-effect')).toHaveTextContent('Critical!')
  })

  it('shows a Nice! bonus effect on a nice-tier correct answer', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={1}
        score={120}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={true}
        battleMessage={null}
        onAnswer={() => {}}
        bonusTier="nice"
      />,
    )
    expect(screen.getByTestId('bonus-effect')).toHaveTextContent('Nice!')
  })

  it('shows no bonus effect on a correct answer with no bonus tier', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={1}
        score={100}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={true}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.queryByTestId('bonus-effect')).not.toBeInTheDocument()
  })

  it('shows no bonus effect on an incorrect answer even if a bonus tier is set', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={false}
        battleMessage={null}
        onAnswer={() => {}}
        bonusTier="critical"
      />,
    )
    expect(screen.queryByTestId('bonus-effect')).not.toBeInTheDocument()
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/screens/BattleScreen.test.tsx`
Expected: FAIL — `turn-timer` and `bonus-effect` testids don't exist yet.

- [ ] **Step 3: Implement**

In `src/screens/BattleScreen.tsx`, add the import and extend the props interface:

```ts
import ComboDisplay from '../components/ComboDisplay'
import Enemy from '../components/Enemy'
import HpBar from '../components/HpBar'
import QuestionPanel from '../components/QuestionPanel'
import type { Enemy as EnemyModel, Question } from '../game/models'
import type { BonusTier } from '../game/scoring'

interface BattleScreenProps {
  enemy: EnemyModel
  question: Question
  answerSeq: number
  level: number
  combo: number
  score: number
  isBoss: boolean
  playerHp: number
  playerMaxHp: number
  lastAnswerCorrect: boolean | null
  battleMessage: string | null
  onAnswer: (value: number) => void
  disabled?: boolean
  elapsedSeconds?: number
  bonusTier?: BonusTier
}
```

Update the function signature to destructure the two new props with defaults:

```ts
export default function BattleScreen({
  enemy,
  question,
  answerSeq,
  level,
  combo,
  score,
  isBoss,
  playerHp,
  playerMaxHp,
  lastAnswerCorrect,
  battleMessage,
  onAnswer,
  disabled,
  elapsedSeconds = 0,
  bonusTier = null,
}: BattleScreenProps) {
```

Replace the level line:

```tsx
      <span className="text-[#e6f1ff]/70 text-sm">レベル {level}</span>
```

with a row that also shows the timer:

```tsx
      <div className="flex justify-between w-full text-[#e6f1ff]/70 text-sm">
        <span>レベル {level}</span>
        <span data-testid="turn-timer">⏱ {elapsedSeconds}秒</span>
      </div>
```

Add the bonus effect right after the existing "せいかい！" span, inside the same `data-testid="answer-feedback"` div:

```tsx
        {!battleMessage && lastAnswerCorrect === true && (
          <span
            key={answerSeq}
            className="text-[#4ade80] font-bold text-lg animate-[feedback-pop_2.5s_ease-out_forwards]"
          >
            せいかい！
          </span>
        )}
        {!battleMessage && lastAnswerCorrect === true && bonusTier && (
          <span
            key={`bonus-${answerSeq}`}
            data-testid="bonus-effect"
            className="ml-2 text-[#ffd166] font-bold text-lg animate-[feedback-pop_2.5s_ease-out_forwards]"
          >
            {bonusTier === 'critical' ? 'Critical!' : 'Nice!'}
          </span>
        )}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/screens/BattleScreen.test.tsx`
Expected: PASS (all tests green, including the pre-existing ones — they don't pass the new optional props, so they exercise the defaults)

- [ ] **Step 5: Commit**

```bash
git add src/screens/BattleScreen.tsx src/screens/BattleScreen.test.tsx
git commit -m "feat: show turn timer and speed bonus effect in BattleScreen"
```

---

## Task 5: Wire the clock into App.tsx

**Files:**
- Modify: `src/app/App.tsx`
- Test: `src/app/App.test.tsx`

**Interfaces:**
- Consumes: `dispatch({ type: 'ANSWER'; value: number; elapsedMs: number })`, `dispatch({ type: 'TIMEOUT' })` (Task 3); `BattleScreen` props `elapsedSeconds` and `bonusTier` (Task 4)

- [ ] **Step 1: Write the failing tests**

Add these test cases to `src/app/App.test.tsx`, inside the `describe('App', ...)` block (after the existing killing-blow tests, before `'shows the game-over screen...'`). Also add `within` and `PLAYER_MAX_HP` to the imports at the top of the file:

```ts
import { act, fireEvent, render, screen, within } from '@testing-library/react'
```

```ts
import { PLAYER_MAX_HP } from '../game/player'
```

New tests:

```ts
  it('counts up the turn timer while waiting for an answer', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    expect(screen.getByTestId('turn-timer')).toHaveTextContent('0')

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByTestId('turn-timer')).toHaveTextContent('3')
  })

  it('resets the turn timer when a new question appears', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByTestId('turn-timer')).toHaveTextContent('3')

    answerCorrectly()

    expect(screen.getByTestId('turn-timer')).toHaveTextContent('0')
  })

  it('automatically misses and damages the player after 20 seconds with no answer', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    act(() => {
      vi.advanceTimersByTime(20000)
    })

    expect(
      within(screen.getByTestId('player-hp-bar')).getByText(`${PLAYER_MAX_HP - 1} / ${PLAYER_MAX_HP}`),
    ).toBeInTheDocument()
  })

  it('shows a Critical! bonus effect when answered within 5 seconds', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    answerCorrectly()

    expect(screen.getByTestId('bonus-effect')).toHaveTextContent('Critical!')
  })

  it('shows a Nice! bonus effect when answered between 5 and 10 seconds', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    act(() => {
      vi.advanceTimersByTime(7000)
    })
    answerCorrectly()

    expect(screen.getByTestId('bonus-effect')).toHaveTextContent('Nice!')
  })

  it('shows no bonus effect when answered after 10 seconds', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    act(() => {
      vi.advanceTimersByTime(12000)
    })
    answerCorrectly()

    expect(screen.queryByTestId('bonus-effect')).not.toBeInTheDocument()
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/app/App.test.tsx`
Expected: FAIL — no `turn-timer`/`bonus-effect` testids rendered, no automatic `TIMEOUT` dispatch happens yet.

- [ ] **Step 3: Implement**

In `src/app/App.tsx`, add the new constants near the existing `KILLING_BLOW_LINGER_MS`:

```ts
// How often the turn-timer display updates, and how long a player has to
// answer before an automatic miss (TIMEOUT) is dispatched.
const TIMER_DISPLAY_INTERVAL_MS = 1000
const TURN_TIMEOUT_MS = 20000
```

Add the ref and state, and the timer-management effect, right after the existing `lingerActive` state declaration:

```ts
  const questionStartedAtRef = useRef(Date.now())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (state.screen !== 'battle') return

    questionStartedAtRef.current = Date.now()
    setElapsedSeconds(0)

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - questionStartedAtRef.current) / 1000))
    }, TIMER_DISPLAY_INTERVAL_MS)

    const timeout = setTimeout(() => {
      dispatch({ type: 'TIMEOUT' })
    }, TURN_TIMEOUT_MS)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
    // Re-runs on every new question (questionsAnswered) and on every
    // screen change (e.g. CONTINUE returning to 'battle' for the next
    // enemy), so the timer always starts fresh for the current turn.
  }, [state.questionsAnswered, state.screen])
```

Update the `onAnswer` handler passed to `BattleScreen` to compute and pass `elapsedMs`, and pass the two new props:

```tsx
        <BattleScreen
          enemy={state.enemy}
          question={question}
          answerSeq={state.questionsAnswered}
          level={state.level}
          combo={state.combo}
          score={state.score}
          isBoss={isBoss}
          playerHp={state.playerHp}
          playerMaxHp={PLAYER_MAX_HP}
          lastAnswerCorrect={state.lastAnswerCorrect}
          battleMessage={state.battleMessage}
          onAnswer={(value) => dispatch({ type: 'ANSWER', value, elapsedMs: Date.now() - questionStartedAtRef.current })}
          disabled={state.screen !== 'battle'}
          elapsedSeconds={elapsedSeconds}
          bonusTier={state.bonusTier}
        />
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/app/App.test.tsx`
Expected: PASS (all tests green)

- [ ] **Step 5: Run the full test suite**

Run: `pnpm vitest run`
Expected: PASS across all files.

- [ ] **Step 6: Type-check**

Run: `pnpm build`
Expected: succeeds with no TypeScript errors (this project's build is `tsc -b && vite build`, so it also validates types).

- [ ] **Step 7: Manually verify in the browser**

Run: `pnpm dev`, open the app, start a battle, and confirm:
- The turn timer counts up once per second next to "レベル".
- Answering within 5 seconds shows "Critical!"; within 5–10 seconds shows "Nice!"; 10–20 seconds shows neither.
- Waiting 20 seconds without answering automatically reduces player HP by 1 and serves a new question, exactly like a wrong answer.

- [ ] **Step 8: Commit**

```bash
git add src/app/App.tsx src/app/App.test.tsx
git commit -m "feat: drive the turn timer and 20s auto-miss timeout from App"
```

---

## Post-implementation check

- [ ] Re-read `docs/superpowers/specs/2026-08-14-turn-timer-bonus-design.md` and confirm every section (data flow, scoring/damage formula, UI, edge cases, testing) is reflected in the code.
- [ ] Confirm `pnpm vitest run` and `pnpm build` both pass with zero failures/errors.
