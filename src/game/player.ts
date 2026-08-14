export const PLAYER_MAX_HP = 4

export function applyMiss(hp: number): number {
  return Math.max(0, hp - 1)
}

export function isGameOver(hp: number): boolean {
  return hp <= 0
}
