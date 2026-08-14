const COMBO_BONUS: Record<number, number> = {
  3: 50,
  5: 100,
  10: 300,
}

export function nextCombo(current: number, correct: boolean): number {
  return correct ? current + 1 : 0
}

// Base +100 per correct answer, plus a one-time milestone bonus the exact
// moment combo reaches 3 / 5 / 10 (spec section 3.4). `combo` is the streak
// count *after* this answer is applied.
export function scoreForAnswer(combo: number): number {
  return 100 + (COMBO_BONUS[combo] ?? 0)
}
