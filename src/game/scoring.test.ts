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
