import { beforeEach, describe, expect, it } from 'vitest'
import { ENEMY_SEQUENCE } from './battle'
import { gameReducer, initGameState, type GameState } from './reducer'

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
