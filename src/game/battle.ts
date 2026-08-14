import type { Enemy } from './models'

export function applyDamage(enemy: Enemy, amount: number): Enemy {
  return { ...enemy, hp: Math.max(0, enemy.hp - amount) }
}

export function isDefeated(enemy: Enemy): boolean {
  return enemy.hp <= 0
}

export interface EnemySegment {
  name: string
  maxHp: number
  questionCount: number
  isBoss: boolean
}

export const ENEMY_SEQUENCE: EnemySegment[] = [
  { name: 'ゴブリン', maxHp: 60, questionCount: 3, isBoss: false },
  { name: 'オーガ', maxHp: 60, questionCount: 3, isBoss: false },
  { name: 'ドラゴン', maxHp: 160, questionCount: 4, isBoss: true },
]

export function createEnemy(segment: EnemySegment): Enemy {
  return { id: segment.name, name: segment.name, maxHp: segment.maxHp, hp: segment.maxHp }
}

export function damagePerCorrectAnswer(segment: EnemySegment, multiplier: number): number {
  return Math.ceil((segment.maxHp / segment.questionCount) * multiplier)
}
