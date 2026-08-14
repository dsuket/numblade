import { beforeEach, describe, expect, it } from 'vitest'
import { loadProgress, saveProgress } from './gameStorage'

describe('gameStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing has been saved', () => {
    expect(loadProgress()).toBeNull()
  })

  it('round-trips saved progress', () => {
    saveProgress({ level: 3, highScore: 1200 })
    expect(loadProgress()).toEqual({ level: 3, highScore: 1200 })
  })

  it('returns null for corrupted stored data', () => {
    localStorage.setItem('numblade-progress', 'not json')
    expect(loadProgress()).toBeNull()
  })

  it('returns null when the stored level is out of the valid 1-6 range', () => {
    localStorage.setItem('numblade-progress', JSON.stringify({ level: 99, highScore: 100 }))
    expect(loadProgress()).toBeNull()
  })

  it('returns null when the stored level is not an integer', () => {
    localStorage.setItem('numblade-progress', JSON.stringify({ level: 2.5, highScore: 100 }))
    expect(loadProgress()).toBeNull()
  })
})
