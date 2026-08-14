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

    // Wrong answers up to (but not including) the miss limit must keep the
    // battle going instead of ending it, regardless of the segment's
    // question count (3).
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
    // The last correct answer for this segment defeats the enemy.
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
    // The first segment needs more than 1 correct answer, so this one is
    // an ordinary mid-battle answer, not a defeat.
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
    // With the level factor applied: answers 1-3 at level 1 (x1.0), 4-6 at
    // level 2 (x1.4), 7-9 at level 3 (x1.8), 10 at level 4 (x2.2) — the
    // adaptive rule bumps the level once per 3-correct streak.
    // 100+100+150 + 140+280+140 + 180+180+180 + 880 = 2330
    expect(state.score).toBe(2330)
    expect(state.maxCombo).toBe(totalQuestions)
  })

  it('raises the level once per 3-correct streak, not on every subsequent answer', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    expect(state.level).toBe(1)

    for (let i = 0; i < 3; i++) {
      state = playCorrectAnswerAdvancing(state)
    }
    expect(state.level).toBe(2)

    // Two more correct answers within the same unbroken streak must not
    // re-trigger the level-up before another full 3-correct window passes.
    state = playCorrectAnswerAdvancing(state)
    expect(state.level).toBe(2)
    state = playCorrectAnswerAdvancing(state)
    expect(state.level).toBe(2)

    // The next 3-correct window (the 6th consecutive correct answer) raises it again.
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

    // A 3rd wrong answer within the same unbroken streak must not
    // re-trigger the level-down before another full 2-wrong window passes.
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
})
