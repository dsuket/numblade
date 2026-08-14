import { beforeEach, describe, expect, it } from 'vitest'
import { ENEMY_SEQUENCE } from './battle'
import { gameReducer, initGameState, type GameState } from './reducer'
import { saveProgress } from '../storage/gameStorage'

function playCorrectAnswer(state: GameState): GameState {
  if (!state.question) throw new Error('no active question')
  return gameReducer(state, { type: 'ANSWER', value: state.question.answer })
}

function playWrongAnswer(state: GameState): GameState {
  if (!state.question) throw new Error('no active question')
  return gameReducer(state, { type: 'ANSWER', value: state.question.answer + 1000 })
}

// Plays a correct answer and, if that defeats a non-final enemy (leaving the
// game on the "defeated" interstitial), immediately continues past it. Used
// by tests that don't care about that pause, just about reaching the next
// question.
function playCorrectAnswerAdvancing(state: GameState): GameState {
  const next = playCorrectAnswer(state)
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

  it('does not end the battle or advance the segment no matter how many wrong answers are given', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    const firstEnemyId = state.enemy!.id

    // Answer wrong far more times than the segment's question count (3) —
    // the battle must keep serving new questions instead of ending.
    for (let i = 0; i < 10; i++) {
      state = playWrongAnswer(state)
      expect(state.screen).toBe('battle')
      expect(state.segmentIndex).toBe(0)
      expect(state.enemy!.id).toBe(firstEnemyId)
      expect(state.enemy!.hp).toBe(state.enemy!.maxHp)
      expect(state.question).not.toBeNull()
    }
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
    state = playCorrectAnswer(state)
    // The first segment needs more than 1 correct answer, so this one is
    // an ordinary mid-battle answer, not a defeat.
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
})
