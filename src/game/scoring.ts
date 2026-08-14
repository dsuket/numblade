const COMBO_BONUS: Record<number, number> = {
  3: 50,
  5: 100,
  10: 300,
}

export function nextCombo(current: number, correct: boolean): number {
  return correct ? current + 1 : 0
}

export type BonusTier = 'critical' | 'nice' | null

// elapsedMs is the time between a question appearing and the player
// answering it. <=5s is a "critical" bonus, <=10s is a "nice" bonus,
// anything slower (up to the 20s auto-miss) gets no bonus.
export function bonusTierForElapsed(elapsedMs: number): BonusTier {
  if (elapsedMs <= 5000) return 'critical'
  if (elapsedMs <= 10000) return 'nice'
  return null
}

export function multiplierForTier(tier: BonusTier): number {
  if (tier === 'critical') return 1.5
  if (tier === 'nice') return 1.2
  return 1
}

// Base +100 per correct answer, plus a one-time milestone bonus the exact
// moment combo reaches 3 / 5 / 10 (spec section 3.4), scaled by the speed
// bonus multiplier and rounded to the nearest point.
export function scoreForAnswer(combo: number, multiplier: number): number {
  return Math.round((100 + (COMBO_BONUS[combo] ?? 0)) * multiplier)
}
