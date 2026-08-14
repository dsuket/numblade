import { describe, expect, it } from 'vitest'
import { applyDamage, createEnemy, damagePerCorrectAnswer, ENEMY_SEQUENCE, isDefeated } from './battle'
import type { Enemy } from './models'

function makeEnemy(hp: number, maxHp = 100): Enemy {
  return { id: 'e1', name: 'Slime', maxHp, hp }
}

describe('applyDamage', () => {
  it('reduces hp by the damage amount', () => {
    const enemy = makeEnemy(100)
    const result = applyDamage(enemy, 30)
    expect(result.hp).toBe(70)
  })

  it('does not reduce hp below 0', () => {
    const enemy = makeEnemy(10)
    const result = applyDamage(enemy, 999)
    expect(result.hp).toBe(0)
  })

  it('does not mutate the original enemy', () => {
    const enemy = makeEnemy(100)
    applyDamage(enemy, 30)
    expect(enemy.hp).toBe(100)
  })
})

describe('isDefeated', () => {
  it('returns true when hp is 0', () => {
    expect(isDefeated(makeEnemy(0))).toBe(true)
  })

  it('returns false when hp is above 0', () => {
    expect(isDefeated(makeEnemy(1))).toBe(false)
  })
})

describe('ENEMY_SEQUENCE', () => {
  it('has 2 normal enemies followed by 1 boss, totaling 10 questions', () => {
    expect(ENEMY_SEQUENCE).toHaveLength(3)
    expect(ENEMY_SEQUENCE.filter((s) => s.isBoss)).toHaveLength(1)
    expect(ENEMY_SEQUENCE[2].isBoss).toBe(true)
    expect(ENEMY_SEQUENCE.reduce((sum, s) => sum + s.questionCount, 0)).toBe(10)
  })
})

describe('createEnemy', () => {
  it('creates an enemy at full hp for the given segment', () => {
    const enemy = createEnemy(ENEMY_SEQUENCE[0])
    expect(enemy.hp).toBe(ENEMY_SEQUENCE[0].maxHp)
    expect(enemy.maxHp).toBe(ENEMY_SEQUENCE[0].maxHp)
  })
})

describe('damagePerCorrectAnswer', () => {
  it('splits maxHp evenly across the segment question count', () => {
    for (const segment of ENEMY_SEQUENCE) {
      expect(damagePerCorrectAnswer(segment) * segment.questionCount).toBeGreaterThanOrEqual(segment.maxHp)
    }
  })
})
