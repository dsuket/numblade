import { describe, expect, it } from 'vitest'
import { generateQuestion } from './questionGenerator'

describe('generateQuestion', () => {
  it('produces an expression whose evaluated answer matches `answer`', () => {
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion(1, 1)
      const [a, , b] = q.expression.split(' ')
      expect(Number(a) * Number(b)).toBe(q.answer)
    }
  })

  it('produces exactly 4 choices with no duplicates', () => {
    const q = generateQuestion(1, 1)
    expect(q.choices).toHaveLength(4)
    expect(new Set(q.choices).size).toBe(4)
  })

  it('includes the correct answer among the choices', () => {
    const q = generateQuestion(1, 1)
    expect(q.choices).toContain(q.answer)
  })

  it('respects digit ranges for each operand', () => {
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion(1, 1)
      const [a, , b] = q.expression.split(' ').map(Number)
      expect(a).toBeGreaterThanOrEqual(1)
      expect(a).toBeLessThanOrEqual(9)
      expect(b).toBeGreaterThanOrEqual(1)
      expect(b).toBeLessThanOrEqual(9)
    }
  })
})
