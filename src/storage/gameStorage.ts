import { MAX_LEVEL, MIN_LEVEL, type DifficultyLevel } from '../game/difficulty'

const STORAGE_KEY = 'numblade-progress'

export interface StoredProgress {
  level: DifficultyLevel
  highScore: number
}

function isValidLevel(value: number): value is DifficultyLevel {
  return Number.isInteger(value) && value >= MIN_LEVEL && value <= MAX_LEVEL
}

export function saveProgress(progress: StoredProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function loadProgress(): StoredProgress | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (!isValidLevel(parsed.level) || typeof parsed.highScore !== 'number') return null
    return parsed as StoredProgress
  } catch {
    return null
  }
}
