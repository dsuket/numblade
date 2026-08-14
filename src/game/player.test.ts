import { describe, expect, test } from 'vitest'
import { applyMiss, isGameOver, PLAYER_MAX_HP } from './player'

describe('applyMiss', () => {
  test('reduces hp by 1', () => {
    expect(applyMiss(4)).toBe(3)
  })

  test('does not go below 0', () => {
    expect(applyMiss(0)).toBe(0)
  })
})

describe('isGameOver', () => {
  test('is false when hp remains', () => {
    expect(isGameOver(1)).toBe(false)
  })

  test('is true when hp reaches 0', () => {
    expect(isGameOver(0)).toBe(true)
  })
})

test('PLAYER_MAX_HP is 4', () => {
  expect(PLAYER_MAX_HP).toBe(4)
})
