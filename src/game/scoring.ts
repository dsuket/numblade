export function nextCombo(current: number, correct: boolean): number {
  return correct ? current + 1 : 0
}

export function scoreForAnswer(_combo: number): number {
  return 100
}
