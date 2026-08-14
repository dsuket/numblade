import type { Question } from './models'

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function digitRange(digits: number): [number, number] {
  if (digits <= 1) return [1, 9]
  const min = 10 ** (digits - 1)
  const max = 10 ** digits - 1
  return [min, max]
}

function buildDistractors(answer: number, count: number): number[] {
  const distractors = new Set<number>()
  const candidates = [
    answer + 1,
    answer - 1,
    answer + 10,
    answer - 10,
    answer * 2,
  ].filter((n) => n > 0 && n !== answer)

  for (const c of candidates) {
    if (distractors.size >= count) break
    distractors.add(c)
  }

  let offset = 2
  while (distractors.size < count) {
    const candidate = answer + offset
    if (candidate > 0 && candidate !== answer) distractors.add(candidate)
    offset += 1
  }

  return Array.from(distractors).slice(0, count)
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function generateQuestion(digitsA: number, digitsB: number): Question {
  const [minA, maxA] = digitRange(digitsA)
  const [minB, maxB] = digitRange(digitsB)
  const a = randomInt(minA, maxA)
  const b = randomInt(minB, maxB)
  const answer = a * b

  const distractors = buildDistractors(answer, 3)
  const choices = shuffle([answer, ...distractors])

  return {
    id: `${Date.now()}-${a}-${b}`,
    expression: `${a} x ${b}`,
    answer,
    choices,
  }
}
