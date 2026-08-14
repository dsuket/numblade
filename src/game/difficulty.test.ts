import { describe, expect, it } from 'vitest'
import { getLevelParams, nextLevel } from './difficulty'

describe('getLevelParams', () => {
  it('Lv1 is single-digit multiplication', () => {
    expect(getLevelParams(1)).toEqual({ operation: 'multiply', digitsA: 1, digitsB: 1 })
  })

  it('Lv3 is division', () => {
    expect(getLevelParams(3).operation).toBe('divide')
  })

  it('Lv6 is 2-digit x 2-digit multiplication', () => {
    expect(getLevelParams(6)).toEqual({ operation: 'multiply', digitsA: 2, digitsB: 2 })
  })
})

describe('nextLevel', () => {
  it('increases by 1 after 3 correct answers in a row', () => {
    expect(nextLevel(2, [true, true, true])).toBe(3)
  })

  it('never exceeds the max level (6)', () => {
    expect(nextLevel(6, [true, true, true])).toBe(6)
  })

  it('decreases by 1 after 2 incorrect answers in a row', () => {
    expect(nextLevel(3, [false, false])).toBe(2)
  })

  it('never drops below the min level (1)', () => {
    expect(nextLevel(1, [false, false])).toBe(1)
  })

  it('stays the same on a mixed streak', () => {
    expect(nextLevel(3, [true, false, true])).toBe(3)
  })
})
