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
  it('awards the base 100 points with no milestone', () => {
    expect(scoreForAnswer(1)).toBe(100)
    expect(scoreForAnswer(2)).toBe(100)
    expect(scoreForAnswer(4)).toBe(100)
  })

  it('adds a +50 bonus exactly at 3-combo', () => {
    expect(scoreForAnswer(3)).toBe(150)
  })

  it('adds a +100 bonus exactly at 5-combo', () => {
    expect(scoreForAnswer(5)).toBe(200)
  })

  it('adds a +300 bonus exactly at 10-combo', () => {
    expect(scoreForAnswer(10)).toBe(400)
  })
})
