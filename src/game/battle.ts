import type { Enemy } from './models'

export function applyDamage(enemy: Enemy, amount: number): Enemy {
  return { ...enemy, hp: Math.max(0, enemy.hp - amount) }
}

export function isDefeated(enemy: Enemy): boolean {
  return enemy.hp <= 0
}
