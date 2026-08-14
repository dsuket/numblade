import { describe, expect, it } from 'vitest'
import { applyDamage, isDefeated } from './battle'
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
