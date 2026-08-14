import type { Operation } from './models'

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6

export const MIN_LEVEL: DifficultyLevel = 1
export const MAX_LEVEL: DifficultyLevel = 6

export interface LevelParams {
  operation: Operation
  digitsA: number
  digitsB: number
}

const LEVEL_PARAMS: Record<DifficultyLevel, LevelParams> = {
  1: { operation: 'multiply', digitsA: 1, digitsB: 1 },
  2: { operation: 'multiply', digitsA: 2, digitsB: 1 },
  3: { operation: 'divide', digitsA: 2, digitsB: 1 },
  4: { operation: 'multiply', digitsA: 3, digitsB: 1 },
  5: { operation: 'divide', digitsA: 3, digitsB: 1 },
  6: { operation: 'multiply', digitsA: 2, digitsB: 2 },
}

export function getLevelParams(level: DifficultyLevel): LevelParams {
  return LEVEL_PARAMS[level]
}

// Adaptive rule (MVP, spec section 3.3): 3 correct in a row raises the level,
// 2 incorrect in a row lowers it. `recentResults` is oldest-to-newest.
export function nextLevel(current: DifficultyLevel, recentResults: boolean[]): DifficultyLevel {
  const lastThree = recentResults.slice(-3)
  const lastTwo = recentResults.slice(-2)

  if (lastThree.length === 3 && lastThree.every(Boolean)) {
    return Math.min(MAX_LEVEL, current + 1) as DifficultyLevel
  }

  if (lastTwo.length === 2 && lastTwo.every((r) => !r)) {
    return Math.max(MIN_LEVEL, current - 1) as DifficultyLevel
  }

  return current
}
