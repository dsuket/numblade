import { describe, expect, it } from 'vitest'
import { nextCombo, scoreForAnswer } from './scoring'

describe('nextCombo', () => {
  it('increments combo by 1 on correct answer', () => {
    expect(nextCombo(2, true)).toBe(3)
  })

  it('resets combo to 0 on incorrect answer', () => {
    expect(nextCombo(5, false)).toBe(0)
  })
})

describe('scoreForAnswer', () => {
  it('awards 100 points regardless of combo (base rule)', () => {
    expect(scoreForAnswer(0)).toBe(100)
    expect(scoreForAnswer(7)).toBe(100)
  })
})
