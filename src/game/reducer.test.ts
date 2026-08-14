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

describe('gameReducer', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('START moves to battle with the first enemy and a question', () => {
    const state = gameReducer(initGameState(), { type: 'START' })
    expect(state.screen).toBe('battle')
    expect(state.enemy?.maxHp).toBe(ENEMY_SEQUENCE[0].maxHp)
    expect(state.question).not.toBeNull()
  })

  it('an incorrect answer resets combo and does not damage the enemy', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    const hpBefore = state.enemy!.hp
    state = playWrongAnswer(state)
    expect(state.combo).toBe(0)
    expect(state.enemy!.hp).toBe(hpBefore)
  })

  it('advances to the second enemy after the first segment question count is used', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    for (let i = 0; i < ENEMY_SEQUENCE[0].questionCount; i++) {
      state = playCorrectAnswer(state)
    }
    expect(state.segmentIndex).toBe(1)
    expect(state.enemy?.maxHp).toBe(ENEMY_SEQUENCE[1].maxHp)
    expect(state.enemy?.hp).toBe(ENEMY_SEQUENCE[1].maxHp)
  })

  it('finishes the game after all 10 questions answered correctly, with combo-bonus score', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    const totalQuestions = ENEMY_SEQUENCE.reduce((sum, s) => sum + s.questionCount, 0)
    for (let i = 0; i < totalQuestions; i++) {
      state = playCorrectAnswer(state)
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
      state = playCorrectAnswer(state)
    }
    expect(state.level).toBe(2)

    // Two more correct answers within the same unbroken streak must not
    // re-trigger the level-up before another full 3-correct window passes.
    state = playCorrectAnswer(state)
    expect(state.level).toBe(2)
    state = playCorrectAnswer(state)
    expect(state.level).toBe(2)

    // The next 3-correct window (the 6th consecutive correct answer) raises it again.
    state = playCorrectAnswer(state)
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
      state = playCorrectAnswer(state)
    }
    const reloaded = initGameState()
    expect(reloaded.highScore).toBe(state.score)
  })
})
