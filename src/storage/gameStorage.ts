import type { DifficultyLevel } from '../game/difficulty'

const STORAGE_KEY = 'numblade-progress'

export interface StoredProgress {
  level: DifficultyLevel
  highScore: number
}

export function saveProgress(progress: StoredProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function loadProgress(): StoredProgress | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed.level !== 'number' || typeof parsed.highScore !== 'number') return null
    return parsed as StoredProgress
  } catch {
    return null
  }
}
