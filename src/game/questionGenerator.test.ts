import { describe, expect, it } from 'vitest'
import { generateQuestion } from './questionGenerator'

describe('generateQuestion (multiply, default operation)', () => {
  it('produces an expression whose evaluated answer matches `answer`', () => {
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion(1, 1)
      const [a, , b] = q.expression.split(' ')
      expect(Number(a) * Number(b)).toBe(q.answer)
    }
  })

  it('produces exactly 4 choices including the answer, no duplicates', () => {
    const q = generateQuestion(1, 1)
    expect(q.choices).toHaveLength(4)
    expect(new Set(q.choices).size).toBe(4)
    expect(q.choices).toContain(q.answer)
  })
})

describe('generateQuestion (divide)', () => {
  it('produces a dividend exactly divisible by the divisor', () => {
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion(2, 1, 'divide')
      const [dividend, divisor] = q.expression.split(' ÷ ').map(Number)
      expect(dividend % divisor).toBe(0)
      expect(dividend / divisor).toBe(q.answer)
    }
  })

  it('keeps the dividend within the requested digit count', () => {
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion(2, 1, 'divide')
      const [dividend] = q.expression.split(' ÷ ').map(Number)
      expect(dividend).toBeGreaterThanOrEqual(10)
      expect(dividend).toBeLessThanOrEqual(99)
    }
  })

  it('produces exactly 4 choices including the answer, no duplicates', () => {
    const q = generateQuestion(2, 1, 'divide')
    expect(q.choices).toHaveLength(4)
    expect(new Set(q.choices).size).toBe(4)
    expect(q.choices).toContain(q.answer)
  })
})
