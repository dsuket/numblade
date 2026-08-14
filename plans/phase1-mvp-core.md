# NUMBLADE Phase 1: MVPコア 実装計画

> **エージェント向け:** このプランをタスクごとに実行する際は superpowers:subagent-driven-development（推奨）または superpowers:executing-plans を使用すること。各ステップはチェックボックス（`- [ ]`）で進捗管理する。**`plans/phase0-prototype.md` の完了が前提**（このプランはPhase 0で作成した `questionGenerator.ts`・`battle.ts`・`scoring.ts`・`App.tsx` を変更する）。

**目的:** Phase 0の「敵1体だけ」の試作を、完全なMVPに仕上げる。通常敵2体+ボスの計10問、適応的難易度（Lv1〜6）、コンボ連続ボーナス、タイトル/リザルト画面遷移、localStorageによる進捗保存を実装し、仕様書9章のMVP受入条件すべてを満たす。

**アーキテクチャ:** 同じくクライアントサイドSPA。ゲーム進行全体を単一の `useReducer` ステートマシン（`src/game/reducer.ts`）にまとめ、3画面（`title` / `battle` / `result`）を制御する。新規のゲーム進行ロジックはすべてReact非依存の `src/game/*` / `src/storage/*` に置き、Reactコンポーネントは状態を読んでactionをdispatchするだけにする。

**技術スタック:** Phase 0と同じ（TypeScript, React 18, Vite, Vitest, @testing-library/react）。CSSはTailwind CSSに統一する。

> **更新履歴:** このプランの各タスクのコード例は、最初にPhase 1を実装した時点のものを記録として残している。CSS（Tailwindへの移行）に加えて、実装後のレビュー・実プレイでのフィードバックを受けて `src/game/reducer.ts` を中心に複数の修正・機能追加が入っており、実際のコードはタスク本文のコード例と異なる。**現在の正しい仕様は本ファイル末尾の「実装後の修正・追加」セクションを参照すること。** タスク本文のコード例は「最初の実装がどう行われたか」の記録として残す。

## 全体制約（Global Constraints）

- 対象仕様書: NUMBLADE プロジェクト計画書・MVP仕様書 v0.1（2026-08-14）。
- Lv7（あまりのある割り算）の回答UIはMVPから明示的に除外する（仕様書12章）。難易度の上限はLv6とする。
- 画像アセットは不要。敵の見た目は絵文字・CSSのプレースホルダーで表現する（仕様書4.2、および10章の「画像制作がボトルネック」というリスクへの対応）。
- 1ゲーム＝合計10問：通常敵2体（各3問）＋ボス1体（4問）（仕様書3.1）。
- スコア: 正解ごとに基礎+100点。コンボ3で+50、コンボ5で+100、コンボ10で+300のボーナス（仕様書3.4）。**判断事項（仕様書に完全には明記されていない点）:** ボーナスは「そのコンボ数に到達した瞬間の1回のみ」加算される一時的なマイルストーン報酬とし、以降毎回加算され続けるものではない。これは仕様書の文言（「3連続正解: …ボーナス+50」）に忠実な解釈である。
- **判断事項（実プレイフィードバックにより修正済み — 詳細は末尾「実装後の修正・追加」参照）:** 敵セグメントの切り替えは、**敵のHPが0になったこと（＝正解の積み重ね）のみ**で判定する。当初は「その敵に割り当てられた問題数を使い切ったら（正誤問わず）切り替える」という設計だったが、これだと不正解が続くと敵を倒していなくても戦闘・ゲームが終わってしまうため変更した。敵のHPは「1問**正解**ごとのダメージ = `ceil(maxHp / questionCount)`」で調整されており、全問正解であればちょうど`questionCount`回の正解でHPが0になる（＝仕様書3.1の「10問」は不正解を含まない総正解数の目安として扱う）。
- **仕様書3.5/6.2からの意図的な簡略化:** 仕様書が想定する `generateQuestion` インターフェースは名前付き引数のオブジェクトを受け取り `skillId` を返す形、また6.2章ではスキルごとの `SkillStats` モデルが示唆されている。本プランでは、よりシンプルな位置引数版 `generateQuestion(digitsA, digitsB, operation)` と、スキル別ではなく単一のローリング配列 `recentResults` によって難易度を適応させる方式を採用する。仕様書9章のMVP受入条件はスキル別トラッキングを要求していないため、これはPhase 3（「苦手再出題・習熟度」）以降で検討すべき事項として今回は見送る。
- パッケージマネージャ: pnpm。
- ソースコード中のコメントは英語で記述する。UI文言・ゲーム内テキストはすべて日本語にする。

---

### Task 1: 難易度レベル（Lv1〜6）と適応ルール

**Files:**
- Create: `src/game/difficulty.ts`
- Test: `src/game/difficulty.test.ts`

**Interfaces:**
- Consumes: `src/game/models.ts` の `Operation`。
- Produces: `DifficultyLevel` 型, `getLevelParams(level): LevelParams`, `nextLevel(current, recentResults): DifficultyLevel` — Task 6（`reducer.ts`）で使用する。

- [ ] **Step 1: 失敗するテスト `src/game/difficulty.test.ts` を書く**

```ts
import { describe, expect, it } from 'vitest'
import { getLevelParams, nextLevel } from './difficulty'

describe('getLevelParams', () => {
  it('Lv1 is single-digit multiplication', () => {
    expect(getLevelParams(1)).toEqual({ operation: 'multiply', digitsA: 1, digitsB: 1 })
  })

  it('Lv3 is division', () => {
    expect(getLevelParams(3).operation).toBe('divide')
  })

  it('Lv6 is 2-digit x 2-digit multiplication', () => {
    expect(getLevelParams(6)).toEqual({ operation: 'multiply', digitsA: 2, digitsB: 2 })
  })
})

describe('nextLevel', () => {
  it('increases by 1 after 3 correct answers in a row', () => {
    expect(nextLevel(2, [true, true, true])).toBe(3)
  })

  it('never exceeds the max level (6)', () => {
    expect(nextLevel(6, [true, true, true])).toBe(6)
  })

  it('decreases by 1 after 2 incorrect answers in a row', () => {
    expect(nextLevel(3, [false, false])).toBe(2)
  })

  it('never drops below the min level (1)', () => {
    expect(nextLevel(1, [false, false])).toBe(1)
  })

  it('stays the same on a mixed streak', () => {
    expect(nextLevel(3, [true, false, true])).toBe(3)
  })
})
```

- [ ] **Step 2: テストを実行して失敗を確認する**

実行: `pnpm test -- difficulty`
期待結果: FAIL — `Cannot find module './difficulty'`。

- [ ] **Step 3: 実装 `src/game/difficulty.ts` を書く**

```ts
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
```

- [ ] **Step 4: テストを実行して成功を確認する**

実行: `pnpm test -- difficulty`
期待結果: PASS — 全8テスト。

- [ ] **Step 5: コミットする**

```bash
git add src/game/difficulty.ts src/game/difficulty.test.ts
git commit -m "feat: add difficulty levels and adaptive level rule"
```

---

### Task 2: 問題生成ロジックの拡張（割り算対応）

**Files:**
- Modify: `src/game/questionGenerator.ts`
- Modify: `src/game/questionGenerator.test.ts`

**Interfaces:**
- Consumes: `src/game/models.ts` の `Operation`, `Question`。
- Produces: `generateQuestion(digitsA, digitsB, operation = 'multiply'): Question`（Phase 0の呼び出し元と後方互換のシグネチャ）— Task 6（`reducer.ts`）で使用する。

- [ ] **Step 1: `src/game/questionGenerator.test.ts` を拡張版の失敗するテストスイートに置き換える**

```ts
import { describe, expect, it } from 'vitest'
import { generateQuestion } from './questionGenerator'

describe('generateQuestion (multiply, default operation)', () => {
  it('produces an expression whose evaluated answer matches `answer`', () => {
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion(1, 1)
      const [a, , b] = q.expression.split(' ')
      expect(Number(a) * Number(b)).toBe(q.answer)
    }
  })

  it('produces exactly 4 choices including the answer, no duplicates', () => {
    const q = generateQuestion(1, 1)
    expect(q.choices).toHaveLength(4)
    expect(new Set(q.choices).size).toBe(4)
    expect(q.choices).toContain(q.answer)
  })
})

describe('generateQuestion (divide)', () => {
  it('produces a dividend exactly divisible by the divisor', () => {
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion(2, 1, 'divide')
      const [dividend, divisor] = q.expression.split(' ÷ ').map(Number)
      expect(dividend % divisor).toBe(0)
      expect(dividend / divisor).toBe(q.answer)
    }
  })

  it('keeps the dividend within the requested digit count', () => {
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion(2, 1, 'divide')
      const [dividend] = q.expression.split(' ÷ ').map(Number)
      expect(dividend).toBeGreaterThanOrEqual(10)
      expect(dividend).toBeLessThanOrEqual(99)
    }
  })

  it('produces exactly 4 choices including the answer, no duplicates', () => {
    const q = generateQuestion(2, 1, 'divide')
    expect(q.choices).toHaveLength(4)
    expect(new Set(q.choices).size).toBe(4)
    expect(q.choices).toContain(q.answer)
  })
})
```

- [ ] **Step 2: テストを実行して割り算関連が失敗することを確認する**

実行: `pnpm test -- questionGenerator`
期待結果: FAIL — 割り算のテストが失敗する（`generateQuestion` が `operation` 引数を受け付けない／`x` の式しか生成しないため）。

- [ ] **Step 3: `src/game/questionGenerator.ts` を拡張版の実装に置き換える**

```ts
import type { Operation, Question } from './models'

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
  const candidates = [answer + 1, answer - 1, answer + 10, answer - 10, answer * 2].filter(
    (n) => n > 0 && n !== answer,
  )

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

function buildQuestion(expression: string, answer: number): Question {
  const distractors = buildDistractors(answer, 3)
  const choices = shuffle([answer, ...distractors])
  return { id: `${Date.now()}-${expression}-${Math.random()}`, expression, answer, choices }
}

function generateMultiplyQuestion(digitsA: number, digitsB: number): Question {
  const [minA, maxA] = digitRange(digitsA)
  const [minB, maxB] = digitRange(digitsB)
  const a = randomInt(minA, maxA)
  const b = randomInt(minB, maxB)
  return buildQuestion(`${a} x ${b}`, a * b)
}

function generateDivideQuestion(digitsA: number, digitsB: number): Question {
  const [minDividend, maxDividend] = digitRange(digitsA)
  const [minDivisor, maxDivisor] = digitRange(digitsB)

  for (let attempt = 0; attempt < 50; attempt++) {
    const divisor = randomInt(minDivisor, maxDivisor)
    const minQuotient = Math.ceil(minDividend / divisor)
    const maxQuotient = Math.floor(maxDividend / divisor)
    if (minQuotient > maxQuotient) continue

    const quotient = randomInt(minQuotient, maxQuotient)
    const dividend = quotient * divisor
    return buildQuestion(`${dividend} ÷ ${divisor}`, quotient)
  }

  // Fallback: guaranteed-valid single-digit case if the loop above can't find a fit.
  const divisor = randomInt(1, 9)
  const quotient = randomInt(1, 9)
  return buildQuestion(`${divisor * quotient} ÷ ${divisor}`, quotient)
}

export function generateQuestion(
  digitsA: number,
  digitsB: number,
  operation: Operation = 'multiply',
): Question {
  return operation === 'divide'
    ? generateDivideQuestion(digitsA, digitsB)
    : generateMultiplyQuestion(digitsA, digitsB)
}
```

- [ ] **Step 4: テストを実行して成功を確認する**

実行: `pnpm test -- questionGenerator`
期待結果: PASS — 全5テスト。

- [ ] **Step 5: コミットする**

```bash
git add src/game/questionGenerator.ts src/game/questionGenerator.test.ts
git commit -m "feat: add division support to question generator"
```

---

### Task 3: コンボ連続ボーナス

**Files:**
- Modify: `src/game/scoring.ts`
- Modify: `src/game/scoring.test.ts`

**Interfaces:**
- Produces: `scoreForAnswer(combo: number): number`（Phase 0の「常に+100」から変更 — マイルストーンボーナスを追加）— Task 6（`reducer.ts`）で使用する。

- [ ] **Step 1: `src/game/scoring.test.ts` を拡張版の失敗するテストスイートに置き換える**

```ts
import { describe, expect, it } from 'vitest'
import { nextCombo, scoreForAnswer } from './scoring'

describe('nextCombo', () => {
  it('increments combo by 1 on correct answer', () => {
    expect(nextCombo(2, true)).toBe(3)
  })

  it('resets combo to 0 on incorrect answer', () => {
    expect(nextCombo(5, false)).toBe(0)
  })
})

describe('scoreForAnswer', () => {
  it('awards the base 100 points with no milestone', () => {
    expect(scoreForAnswer(1)).toBe(100)
    expect(scoreForAnswer(2)).toBe(100)
    expect(scoreForAnswer(4)).toBe(100)
  })

  it('adds a +50 bonus exactly at 3-combo', () => {
    expect(scoreForAnswer(3)).toBe(150)
  })

  it('adds a +100 bonus exactly at 5-combo', () => {
    expect(scoreForAnswer(5)).toBe(200)
  })

  it('adds a +300 bonus exactly at 10-combo', () => {
    expect(scoreForAnswer(10)).toBe(400)
  })
})
```

- [ ] **Step 2: テストを実行してマイルストーン関連が失敗することを確認する**

実行: `pnpm test -- scoring`
期待結果: FAIL — `scoreForAnswer(3)` などが100を返し、ボーナスが加算されていない。

- [ ] **Step 3: `src/game/scoring.ts` を拡張版の実装に置き換える**

```ts
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
```

- [ ] **Step 4: テストを実行して成功を確認する**

実行: `pnpm test -- scoring`
期待結果: PASS — 全6テスト。

- [ ] **Step 5: コミットする**

```bash
git add src/game/scoring.ts src/game/scoring.test.ts
git commit -m "feat: add combo milestone score bonuses"
```

---

### Task 4: localStorageによる進捗保存

**Files:**
- Create: `src/storage/gameStorage.ts`
- Test: `src/storage/gameStorage.test.ts`

**Interfaces:**
- Consumes: `src/game/difficulty.ts`（Task 1）の `DifficultyLevel`。
- Produces: `StoredProgress` 型, `saveProgress(progress)`, `loadProgress(): StoredProgress | null` — Task 6（`reducer.ts`）で使用する。

- [ ] **Step 1: 失敗するテスト `src/storage/gameStorage.test.ts` を書く**

```ts
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
})
```

- [ ] **Step 2: テストを実行して失敗を確認する**

実行: `pnpm test -- gameStorage`
期待結果: FAIL — `Cannot find module './gameStorage'`。

- [ ] **Step 3: 実装 `src/storage/gameStorage.ts` を書く**

```ts
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
```

- [ ] **Step 4: テストを実行して成功を確認する**

実行: `pnpm test -- gameStorage`
期待結果: PASS — 全3テスト。

- [ ] **Step 5: コミットする**

```bash
git add src/storage/gameStorage.ts src/storage/gameStorage.test.ts
git commit -m "feat: add localStorage progress persistence"
```

---

### Task 5: 敵の登場順（通常敵2体＋ボス）

**Files:**
- Modify: `src/game/battle.ts`
- Modify: `src/game/battle.test.ts`

**Interfaces:**
- Consumes: `src/game/models.ts` の `Enemy`。
- Produces: `EnemySegment` 型, `ENEMY_SEQUENCE: EnemySegment[]`, `createEnemy(segment): Enemy`, `damagePerCorrectAnswer(segment): number` — Task 6（`reducer.ts`）およびTask 9（`App.tsx`、ボス判定）で使用する。

- [ ] **Step 1: `src/game/battle.test.ts` に失敗するテストを追記する**

```ts
import { describe, expect, it } from 'vitest'
import { applyDamage, createEnemy, damagePerCorrectAnswer, ENEMY_SEQUENCE, isDefeated } from './battle'
import type { Enemy } from './models'

function makeEnemy(hp: number, maxHp = 100): Enemy {
  return { id: 'e1', name: 'Slime', maxHp, hp }
}

describe('applyDamage', () => {
  it('reduces hp by the damage amount', () => {
    const enemy = makeEnemy(100)
    const result = applyDamage(enemy, 30)
    expect(result.hp).toBe(70)
  })

  it('does not reduce hp below 0', () => {
    const enemy = makeEnemy(10)
    const result = applyDamage(enemy, 999)
    expect(result.hp).toBe(0)
  })

  it('does not mutate the original enemy', () => {
    const enemy = makeEnemy(100)
    applyDamage(enemy, 30)
    expect(enemy.hp).toBe(100)
  })
})

describe('isDefeated', () => {
  it('returns true when hp is 0', () => {
    expect(isDefeated(makeEnemy(0))).toBe(true)
  })

  it('returns false when hp is above 0', () => {
    expect(isDefeated(makeEnemy(1))).toBe(false)
  })
})

describe('ENEMY_SEQUENCE', () => {
  it('has 2 normal enemies followed by 1 boss, totaling 10 questions', () => {
    expect(ENEMY_SEQUENCE).toHaveLength(3)
    expect(ENEMY_SEQUENCE.filter((s) => s.isBoss)).toHaveLength(1)
    expect(ENEMY_SEQUENCE[2].isBoss).toBe(true)
    expect(ENEMY_SEQUENCE.reduce((sum, s) => sum + s.questionCount, 0)).toBe(10)
  })
})

describe('createEnemy', () => {
  it('creates an enemy at full hp for the given segment', () => {
    const enemy = createEnemy(ENEMY_SEQUENCE[0])
    expect(enemy.hp).toBe(ENEMY_SEQUENCE[0].maxHp)
    expect(enemy.maxHp).toBe(ENEMY_SEQUENCE[0].maxHp)
  })
})

describe('damagePerCorrectAnswer', () => {
  it('splits maxHp evenly across the segment question count', () => {
    for (const segment of ENEMY_SEQUENCE) {
      expect(damagePerCorrectAnswer(segment) * segment.questionCount).toBeGreaterThanOrEqual(segment.maxHp)
    }
  })
})
```

- [ ] **Step 2: テストを実行して新規テストが失敗することを確認する**

実行: `pnpm test -- battle`
期待結果: FAIL — `ENEMY_SEQUENCE`, `createEnemy`, `damagePerCorrectAnswer` がexportされていない。

- [ ] **Step 3: `src/game/battle.ts` を拡張版の実装に置き換える**

```ts
import type { Enemy } from './models'

export function applyDamage(enemy: Enemy, amount: number): Enemy {
  return { ...enemy, hp: Math.max(0, enemy.hp - amount) }
}

export function isDefeated(enemy: Enemy): boolean {
  return enemy.hp <= 0
}

export interface EnemySegment {
  name: string
  maxHp: number
  questionCount: number
  isBoss: boolean
}

export const ENEMY_SEQUENCE: EnemySegment[] = [
  { name: 'ゴブリン', maxHp: 60, questionCount: 3, isBoss: false },
  { name: 'オーガ', maxHp: 60, questionCount: 3, isBoss: false },
  { name: 'ドラゴン', maxHp: 160, questionCount: 4, isBoss: true },
]

export function createEnemy(segment: EnemySegment): Enemy {
  return { id: segment.name, name: segment.name, maxHp: segment.maxHp, hp: segment.maxHp }
}

export function damagePerCorrectAnswer(segment: EnemySegment): number {
  return Math.ceil(segment.maxHp / segment.questionCount)
}
```

- [ ] **Step 4: テストを実行して成功を確認する**

実行: `pnpm test -- battle`
期待結果: PASS — 全9テスト。

- [ ] **Step 5: コミットする**

```bash
git add src/game/battle.ts src/game/battle.test.ts
git commit -m "feat: add enemy sequence (2 normal enemies + boss)"
```

---

### Task 6: ゲームReducer（10問ループ全体）

**Files:**
- Create: `src/game/reducer.ts`
- Test: `src/game/reducer.test.ts`

**Interfaces:**
- Consumes: `ENEMY_SEQUENCE`, `createEnemy`, `damagePerCorrectAnswer`, `applyDamage`, `isDefeated`（Task 5）; `getLevelParams`, `nextLevel`, `DifficultyLevel`（Task 1）; `generateQuestion`（Task 2）; `nextCombo`, `scoreForAnswer`（Task 3）; `loadProgress`, `saveProgress`（Task 4）; `src/game/models.ts` の `Enemy`, `Question`。
- Produces: `GameState`, `GameAction`, `Screen` 型, `initGameState(): GameState`, `gameReducer(state, action): GameState` — Task 9（`App.tsx`）で使用する。

- [ ] **Step 1: 失敗するテスト `src/game/reducer.test.ts` を書く**

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { ENEMY_SEQUENCE } from './battle'
import { gameReducer, initGameState, type GameState } from './reducer'

function playCorrectAnswer(state: GameState): GameState {
  if (!state.question) throw new Error('no active question')
  return gameReducer(state, { type: 'ANSWER', value: state.question.answer })
}

function playWrongAnswer(state: GameState): GameState {
  if (!state.question) throw new Error('no active question')
  return gameReducer(state, { type: 'ANSWER', value: state.question.answer + 1000 })
}

describe('gameReducer', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('START moves to battle with the first enemy and a question', () => {
    const state = gameReducer(initGameState(), { type: 'START' })
    expect(state.screen).toBe('battle')
    expect(state.enemy?.maxHp).toBe(ENEMY_SEQUENCE[0].maxHp)
    expect(state.question).not.toBeNull()
  })

  it('an incorrect answer resets combo and does not damage the enemy', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    const hpBefore = state.enemy!.hp
    state = playWrongAnswer(state)
    expect(state.combo).toBe(0)
    expect(state.enemy!.hp).toBe(hpBefore)
  })

  it('advances to the second enemy after the first segment question count is used', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    for (let i = 0; i < ENEMY_SEQUENCE[0].questionCount; i++) {
      state = playCorrectAnswer(state)
    }
    expect(state.segmentIndex).toBe(1)
    expect(state.enemy?.maxHp).toBe(ENEMY_SEQUENCE[1].maxHp)
    expect(state.enemy?.hp).toBe(ENEMY_SEQUENCE[1].maxHp)
  })

  it('finishes the game after all 10 questions answered correctly, with combo-bonus score', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    const totalQuestions = ENEMY_SEQUENCE.reduce((sum, s) => sum + s.questionCount, 0)
    for (let i = 0; i < totalQuestions; i++) {
      state = playCorrectAnswer(state)
    }
    expect(state.screen).toBe('result')
    expect(state.correctAnswered).toBe(totalQuestions)
    expect(state.score).toBe(1450)
    expect(state.maxCombo).toBe(totalQuestions)
  })

  it('persists highScore to storage when the game ends', () => {
    let state = gameReducer(initGameState(), { type: 'START' })
    const totalQuestions = ENEMY_SEQUENCE.reduce((sum, s) => sum + s.questionCount, 0)
    for (let i = 0; i < totalQuestions; i++) {
      state = playCorrectAnswer(state)
    }
    const reloaded = initGameState()
    expect(reloaded.highScore).toBe(state.score)
  })
})
```

- [ ] **Step 2: テストを実行して失敗を確認する**

実行: `pnpm test -- reducer`
期待結果: FAIL — `Cannot find module './reducer'`。

- [ ] **Step 3: 実装 `src/game/reducer.ts` を書く**

```ts
import { applyDamage, createEnemy, damagePerCorrectAnswer, ENEMY_SEQUENCE, isDefeated } from './battle'
import { getLevelParams, nextLevel, type DifficultyLevel } from './difficulty'
import type { Enemy, Question } from './models'
import { generateQuestion } from './questionGenerator'
import { nextCombo, scoreForAnswer } from './scoring'
import { loadProgress, saveProgress } from '../storage/gameStorage'

export type Screen = 'title' | 'battle' | 'result'

export interface GameState {
  screen: Screen
  level: DifficultyLevel
  highScore: number
  score: number
  combo: number
  maxCombo: number
  segmentIndex: number
  enemy: Enemy | null
  question: Question | null
  questionsAnswered: number
  correctAnswered: number
  recentResults: boolean[]
  lastAnswerCorrect: boolean | null
}

export type GameAction = { type: 'START' } | { type: 'ANSWER'; value: number } | { type: 'RESTART' }

function questionForLevel(level: DifficultyLevel): Question {
  const params = getLevelParams(level)
  return generateQuestion(params.digitsA, params.digitsB, params.operation)
}

function segmentQuestionsBefore(segmentIndex: number): number {
  return ENEMY_SEQUENCE.slice(0, segmentIndex).reduce((sum, s) => sum + s.questionCount, 0)
}

export function initGameState(): GameState {
  const stored = loadProgress()
  return {
    screen: 'title',
    level: stored?.level ?? 1,
    highScore: stored?.highScore ?? 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    segmentIndex: 0,
    enemy: null,
    question: null,
    questionsAnswered: 0,
    correctAnswered: 0,
    recentResults: [],
    lastAnswerCorrect: null,
  }
}

function startBattle(state: GameState): GameState {
  const segment = ENEMY_SEQUENCE[0]
  return {
    ...state,
    screen: 'battle',
    score: 0,
    combo: 0,
    maxCombo: 0,
    segmentIndex: 0,
    enemy: createEnemy(segment),
    question: questionForLevel(state.level),
    questionsAnswered: 0,
    correctAnswered: 0,
    recentResults: [],
    lastAnswerCorrect: null,
  }
}

function answer(state: GameState, value: number): GameState {
  if (state.screen !== 'battle' || !state.enemy || !state.question) return state

  const segment = ENEMY_SEQUENCE[state.segmentIndex]
  const correct = value === state.question.answer
  const combo = nextCombo(state.combo, correct)
  const maxCombo = Math.max(state.maxCombo, combo)
  const score = state.score + (correct ? scoreForAnswer(combo) : 0)
  const enemy = correct ? applyDamage(state.enemy, damagePerCorrectAnswer(segment)) : state.enemy
  const questionsAnswered = state.questionsAnswered + 1
  const correctAnswered = state.correctAnswered + (correct ? 1 : 0)
  const recentResults = [...state.recentResults, correct].slice(-3)
  const level = nextLevel(state.level, recentResults)

  const segmentQuestionsUsed = questionsAnswered - segmentQuestionsBefore(state.segmentIndex)
  const segmentDone = segmentQuestionsUsed >= segment.questionCount || isDefeated(enemy)
  const isLastSegment = state.segmentIndex === ENEMY_SEQUENCE.length - 1

  const base: GameState = {
    ...state,
    level,
    score,
    combo,
    maxCombo,
    enemy,
    questionsAnswered,
    correctAnswered,
    recentResults,
    lastAnswerCorrect: correct,
  }

  if (segmentDone && isLastSegment) {
    const highScore = Math.max(state.highScore, score)
    saveProgress({ level, highScore })
    return { ...base, screen: 'result', highScore, question: null }
  }

  if (segmentDone) {
    const nextSegmentIndex = state.segmentIndex + 1
    return {
      ...base,
      segmentIndex: nextSegmentIndex,
      enemy: createEnemy(ENEMY_SEQUENCE[nextSegmentIndex]),
      question: questionForLevel(level),
    }
  }

  return { ...base, question: questionForLevel(level) }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      return startBattle(state)
    case 'ANSWER':
      return answer(state, action.value)
    case 'RESTART':
      return startBattle(state)
    default:
      return state
  }
}
```

- [ ] **Step 4: テストを実行して成功を確認する**

実行: `pnpm test -- reducer`
期待結果: PASS — 全5テスト。

- [ ] **Step 5: コミットする**

```bash
git add src/game/reducer.ts src/game/reducer.test.ts
git commit -m "feat: add game reducer for the full 10-question loop"
```

---

### Task 7: コンボ表示・敵表示コンポーネント

**Files:**
- Create: `src/components/ComboDisplay.tsx`
- Create: `src/components/ComboDisplay.css`
- Create: `src/components/Enemy.tsx`
- Create: `src/components/Enemy.css`

**Interfaces:**
- Consumes: `src/game/models.ts` の `Enemy` 型。
- Produces: `ComboDisplay`, `Enemy` コンポーネント — Task 8（`BattleScreen.tsx`）で使用する。

- [ ] **Step 1: `src/components/ComboDisplay.tsx` を書く**

```tsx
import './ComboDisplay.css'

interface ComboDisplayProps {
  combo: number
}

export default function ComboDisplay({ combo }: ComboDisplayProps) {
  const isMilestone = combo === 3 || combo === 5 || combo === 10
  return (
    <div className={`combo-display${isMilestone ? ' combo-display--milestone' : ''}`}>
      コンボ {combo}
    </div>
  )
}
```

- [ ] **Step 2: `src/components/ComboDisplay.css` を書く**

```css
.combo-display {
  font-size: 1.25rem;
  color: #ffd166;
  font-weight: bold;
}

.combo-display--milestone {
  color: #ff4d6d;
  text-shadow: 0 0 8px #ff4d6d;
}
```

- [ ] **Step 3: `src/components/Enemy.tsx` を書く**

```tsx
import type { Enemy as EnemyModel } from '../game/models'
import './Enemy.css'

interface EnemyProps {
  enemy: EnemyModel
  isBoss?: boolean
}

export default function Enemy({ enemy, isBoss }: EnemyProps) {
  return (
    <div className={`enemy${isBoss ? ' enemy--boss' : ''}`} data-testid="enemy">
      <div className="enemy-sprite" aria-hidden="true">
        {isBoss ? '🐉' : '👾'}
      </div>
      <div className="enemy-name">{enemy.name}</div>
    </div>
  )
}
```

- [ ] **Step 4: `src/components/Enemy.css` を書く**

```css
.enemy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.enemy-sprite {
  font-size: 4rem;
}

.enemy--boss .enemy-sprite {
  font-size: 6rem;
  filter: drop-shadow(0 0 12px #ff4d6d);
}

.enemy-name {
  color: #e6f1ff;
  font-size: 1rem;
}
```

- [ ] **Step 5: コミットする**

```bash
git add src/components/ComboDisplay.tsx src/components/ComboDisplay.css src/components/Enemy.tsx src/components/Enemy.css
git commit -m "feat: add combo display and enemy components"
```

---

### Task 8: 画面コンポーネント（タイトル・バトル・リザルト）

**Files:**
- Create: `src/screens/TitleScreen.tsx`
- Create: `src/screens/TitleScreen.css`
- Create: `src/screens/BattleScreen.tsx`
- Create: `src/screens/BattleScreen.css`
- Create: `src/screens/ResultScreen.tsx`
- Create: `src/screens/ResultScreen.css`

**Interfaces:**
- Consumes: `HpBar`, `QuestionPanel`（Phase 0 Task 6）, `ComboDisplay`, `Enemy`（Task 7）, `src/game/models.ts` の `Enemy`/`Question` 型。
- Produces: `TitleScreen`, `BattleScreen`, `ResultScreen` コンポーネント — Task 9（`App.tsx`）で使用する。

- [ ] **Step 1: `src/screens/TitleScreen.tsx` を書く**

```tsx
import './TitleScreen.css'

interface TitleScreenProps {
  highScore: number
  onStart: () => void
}

export default function TitleScreen({ highScore, onStart }: TitleScreenProps) {
  return (
    <div className="title-screen">
      <h1 className="title-logo">NUMBLADE</h1>
      <p className="title-tagline">数字を解け。敵を斬れ。</p>
      {highScore > 0 && <p className="title-highscore">ハイスコア: {highScore}</p>}
      <button type="button" className="title-start-button" onClick={onStart}>
        スタート
      </button>
    </div>
  )
}
```

- [ ] **Step 2: `src/screens/TitleScreen.css` を書く**

```css
.title-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #e6f1ff;
}

.title-logo {
  font-size: 3rem;
  letter-spacing: 0.1em;
}

.title-start-button {
  min-height: 64px;
  min-width: 200px;
  font-size: 1.5rem;
  border-radius: 12px;
  border: none;
  background: #3a86ff;
  color: white;
  cursor: pointer;
}
```

- [ ] **Step 3: `src/screens/BattleScreen.tsx` を書く**

```tsx
import ComboDisplay from '../components/ComboDisplay'
import Enemy from '../components/Enemy'
import HpBar from '../components/HpBar'
import QuestionPanel from '../components/QuestionPanel'
import type { Enemy as EnemyModel, Question } from '../game/models'
import './BattleScreen.css'

interface BattleScreenProps {
  enemy: EnemyModel
  question: Question
  combo: number
  score: number
  isBoss: boolean
  onAnswer: (value: number) => void
}

export default function BattleScreen({
  enemy,
  question,
  combo,
  score,
  isBoss,
  onAnswer,
}: BattleScreenProps) {
  return (
    <div className="battle-screen">
      <Enemy enemy={enemy} isBoss={isBoss} />
      <HpBar hp={enemy.hp} maxHp={enemy.maxHp} />
      <div className="battle-hud">
        <ComboDisplay combo={combo} />
        <span className="battle-score">スコア {score}</span>
      </div>
      <QuestionPanel question={question} onAnswer={onAnswer} />
    </div>
  )
}
```

- [ ] **Step 4: `src/screens/BattleScreen.css` を書く**

```css
.battle-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 480px;
  padding: 1rem;
}

.battle-hud {
  display: flex;
  justify-content: space-between;
  width: 100%;
  color: #e6f1ff;
}
```

- [ ] **Step 5: `src/screens/ResultScreen.tsx` を書く**

```tsx
import './ResultScreen.css'

interface ResultScreenProps {
  correctAnswered: number
  questionsAnswered: number
  maxCombo: number
  score: number
  highScore: number
  onRestart: () => void
}

export default function ResultScreen({
  correctAnswered,
  questionsAnswered,
  maxCombo,
  score,
  highScore,
  onRestart,
}: ResultScreenProps) {
  const accuracy = questionsAnswered === 0 ? 0 : Math.round((correctAnswered / questionsAnswered) * 100)

  return (
    <div className="result-screen">
      <h2>リザルト</h2>
      <p>
        正答数: {correctAnswered} / {questionsAnswered}
      </p>
      <p>正答率: {accuracy}%</p>
      <p>最大コンボ: {maxCombo}</p>
      <p>スコア: {score}</p>
      <p>ハイスコア: {highScore}</p>
      <button type="button" className="result-restart-button" onClick={onRestart}>
        もう一度
      </button>
    </div>
  )
}
```

- [ ] **Step 6: `src/screens/ResultScreen.css` を書く**

```css
.result-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #e6f1ff;
}

.result-restart-button {
  min-height: 64px;
  min-width: 200px;
  font-size: 1.25rem;
  border-radius: 12px;
  border: none;
  background: #3a86ff;
  color: white;
  cursor: pointer;
  margin-top: 1rem;
}
```

- [ ] **Step 7: コミットする**

```bash
git add src/screens
git commit -m "feat: add title, battle, and result screens"
```

---

### Task 9: App.tsxをReducerに接続する（全画面遷移）

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`

**Interfaces:**
- Consumes: `gameReducer`, `initGameState`（Task 6）, `ENEMY_SEQUENCE`（Task 5）, `TitleScreen`, `BattleScreen`, `ResultScreen`（Task 8）。

- [ ] **Step 1: `src/app/App.tsx` を置き換える**

```tsx
import { useReducer } from 'react'
import { ENEMY_SEQUENCE } from '../game/battle'
import { gameReducer, initGameState } from '../game/reducer'
import BattleScreen from '../screens/BattleScreen'
import ResultScreen from '../screens/ResultScreen'
import TitleScreen from '../screens/TitleScreen'
import './App.css'

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, initGameState)

  if (state.screen === 'title') {
    return (
      <div className="app">
        <TitleScreen highScore={state.highScore} onStart={() => dispatch({ type: 'START' })} />
      </div>
    )
  }

  if (state.screen === 'battle' && state.enemy && state.question) {
    const isBoss = ENEMY_SEQUENCE[state.segmentIndex].isBoss
    return (
      <div className="app">
        <BattleScreen
          enemy={state.enemy}
          question={state.question}
          combo={state.combo}
          score={state.score}
          isBoss={isBoss}
          onAnswer={(value) => dispatch({ type: 'ANSWER', value })}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <ResultScreen
        correctAnswered={state.correctAnswered}
        questionsAnswered={state.questionsAnswered}
        maxCombo={state.maxCombo}
        score={state.score}
        highScore={state.highScore}
        onRestart={() => dispatch({ type: 'RESTART' })}
      />
    </div>
  )
}
```

- [ ] **Step 2: `src/app/App.test.tsx` を置き換える**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows the title screen with a start button', () => {
    render(<App />)
    expect(screen.getByText('NUMBLADE')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'スタート' })).toBeInTheDocument()
  })

  it('starts the battle after clicking the start button', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))
    expect(screen.getByTestId('enemy')).toBeInTheDocument()
    expect(screen.getByText(/=\s*\?/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: テストスイート全体を実行する**

実行: `pnpm test`
期待結果: PASS — `src/game`, `src/storage`, `src/app` 配下の全スイート。

- [ ] **Step 4: 手動確認**

実行: `pnpm dev`、ローカルURLを開き、「スタート」をクリックして10問すべてに答える（正解・不正解を混ぜる）。確認項目: 敵が2回切り替わる（通常敵2体＋見た目の異なるボス）、不正解でコンボがリセットされる、リザルト画面に正答率・最大コンボ・スコア・ハイスコアが表示される、「もう一度」で新しいバトルに戻る、ゲーム終了後にページをリロードしてもタイトル画面のハイスコアが更新された値で保持されている。

- [ ] **Step 5: コミットする**

```bash
git add src/app/App.tsx src/app/App.test.tsx
git commit -m "feat: wire full title/battle/result game loop"
```

---

### Task 10: MVP受入条件チェック（仕様書9章）

**Files:** なし（検証のみのタスク）。

- [ ] **Step 1: 自動テストスイートを全体実行する**

実行: `pnpm test`
期待結果: PASS — 全スイートで失敗0件。

- [ ] **Step 2: 本番ビルドを実行する**

実行: `pnpm build`
期待結果: TypeScriptエラーなく成功する。

- [ ] **Step 3: 仕様書9章の受入条件を、実際に動くアプリ（`pnpm dev`）で1つずつ確認する**

それぞれチェックし、どの実装が満たしているかを併記する:

- [ ] STARTからResultまでページ再読込なしで完走できる → `App.tsx` の画面遷移（Task 9）。`src/` 内に `window.location` の呼び出しがないこと。
- [ ] 10問が生成され、正解が必ず4択内に1つだけ存在する → `buildQuestion` は常に `answer` を `choices` に含め、重複しない3つのダミー選択肢を生成する（Phase 0 Task 3 / 本プランTask 2）。`ENEMY_SEQUENCE` の合計問題数は10（Task 5）。
- [ ] 掛け算・割り算の各レベルで指定桁数の問題が正しく生成される → `getLevelParams` + `generateQuestion` の桁数範囲テスト（Task 1, Task 2）。
- [ ] 正解時に敵HP・スコア・コンボが正しく更新される → `reducer.test.ts` の「finishes the game...」テスト（Task 6）。
- [ ] 不正解時にコンボがリセットされる → `reducer.test.ts` の「an incorrect answer resets combo...」テスト（Task 6）。
- [ ] 通常敵2体とBossのゲーム進行が成立する → `reducer.test.ts` の「advances to the second enemy...」テスト＋手動確認（Task 9 Step 4）。
- [ ] ゲーム終了時に正答数、正答率、最大コンボ、スコアを表示する → `ResultScreen.tsx`（Task 8）。
- [ ] リロード後もレベル・ハイスコア等の保存対象が復元される → `initGameState` が `loadProgress()` を読む（Task 6）。手動リロード確認（Task 9 Step 4）。
- [ ] タブレット横画面で主要UIがスクロールなし、または最小限のスクロールで操作できる → 手動確認: ブラウザのdevtoolsでタブレット横画面相当の解像度（例: 1024x768）にし、`BattleScreen` がスクロールなしで収まることを確認する。

- [ ] **Step 4: 見つかった不備を記録する**

チェックリストの項目が満たされない場合はチェックを付けず、Phase 1を完了扱いにせず、PR説明やフォローアップタスクとして不備を明記する。

## Phase 1 完了条件（Definition of Done）

- [ ] Phase 0・Phase 1すべての自動テストが通ること（`pnpm test`）。
- [ ] `pnpm build` が成功すること。
- [ ] Task 10の受入チェックリストの全項目が、実際に動くアプリで確認済みであること。

---

## 実装後の修正・追加（レビュー・実プレイフィードバック反映）

上記タスクのコード例はPhase 1初回実装時点のものであり、その後の独立レビューと実際にプレイしたユーザーからのフィードバックを受けて `src/game/reducer.ts` を中心に修正・機能追加を行った。現時点の正しい仕様は以下の通り。対応するコード例が本ファイル内にない場合は、ファイルパスとふるまいの説明のみを記載する。

### 1. 適応難易度がストリーク中ずっと発火し続けるバグを修正

**症状:** `nextLevel` の判定に使う `recentResults`（直近3件のローリング配列）が、レベルが変わった後もリセットされなかったため、正解（または不正解）が連続する間ずっと毎回レベルが変動していた（例: 10連続正解でLv1→6まで一気に上昇）。

**修正:** `src/game/reducer.ts` の `answer()` で、`nextLevel` の結果が現在のレベルと異なる（＝実際にレベルが変わった）場合のみ `recentResults` を `[]` にリセットする。3連続正解 / 2連続不正解の「窓」が1回発火したら仕切り直すことで、意図通り「3連続正解ごとに1段階上昇」というふるまいになる。

**関連ファイル:** `src/game/reducer.ts`, `src/game/reducer.test.ts`（レベルの遷移を検証するテストを追加）。

### 2. localStorageの`level`にバリデーションを追加

**内容:** `src/storage/gameStorage.ts` の `loadProgress()` で、`level` が `1〜6` の整数であることを検証するようにした（`isValidLevel`）。範囲外・小数など不正な値が保存されていた場合は `null` を返し、`questionForLevel()` が未定義の難易度パラメータでクラッシュすることを防ぐ。

**関連ファイル:** `src/storage/gameStorage.ts`, `src/storage/gameStorage.test.ts`。

### 3. 不正解ではセグメント・ゲームが終わらないように修正（Global Constraintsの判断事項を修正）

**症状:** セグメント終了判定が「回答した問題数（正誤問わず）がそのセグメントの割当数に達したか」で行われていたため、不正解が続くと敵を倒していなくても戦闘やゲームが終わってしまっていた。

**修正:** `src/game/reducer.ts` の `segmentDone` を `isDefeated(enemy)` のみで判定するように変更（旧: `segmentQuestionsUsed >= segment.questionCount || isDefeated(enemy)`）。ダメージは正解時のみ発生するため、これにより「セグメントは正解の積み重ねでのみ終わる」という意図通りのふるまいになる。不正解は何度でも許容し、新しい問題を出し続ける（MVPではプレイヤーの失敗によるペナルティなし、という仕様書7章の意図とも整合）。

**関連ファイル:** `src/game/reducer.ts`, `src/game/reducer.test.ts`（不正解を10回連続しても戦闘が終わらないことを検証するテストを追加）。

### 4. 正解・不正解のフィードバック表示を追加

**内容:** `GameState.lastAnswerCorrect` は元から存在していたが、どの画面でも参照されておらず、不正解時に画面上で何も変化が分からない状態だった。`BattleScreen.tsx` に、正解時は「せいかい！」（緑）、不正解時は「ざんねん…もういちど！」（赤）を表示するフィードバック領域を追加した。

**関連ファイル:** `src/screens/BattleScreen.tsx`, `src/screens/BattleScreen.test.tsx`。

### 5. 敵の出現・撃破メッセージを追加

**内容:** `GameState` に `battleMessage: string | null` を追加。戦闘開始時（最初の敵）と、敵を倒して次の敵に進んだ直後に `「${敵名}があらわれた！」` を表示する。`battleMessage` が存在する間はTask 4の正解/不正解フィードバックより優先して表示される。

**関連ファイル:** `src/game/reducer.ts`, `src/screens/BattleScreen.tsx`, `src/app/App.tsx`。

### 6. 撃破後にタップで次の敵へ進む「defeated」画面を追加

**内容:** 敵を倒した瞬間に次の敵へ自動的に切り替わっていたのを止め、`Screen` 型に `'defeated'` を追加。倒した敵のグラフィックを薄暗く表示した上に「${敵名}をたおした！」を重ねて表示し、画面（ボタン）をタップすると `CONTINUE` アクションが発行されて次の敵が登場する（このタイミングで上記5の「${次の敵}があらわれた！」メッセージが出る）。ボス（最終セグメント）撃破時はこの中間画面を挟まず、そのままリザルト画面に遷移する。

**新規ファイル:** `src/screens/DefeatedScreen.tsx`, `src/screens/DefeatedScreen.test.tsx`。
**変更ファイル:** `src/game/reducer.ts`（`GameAction` に `CONTINUE` を追加、`continueAfterDefeat()` を新設）, `src/app/App.tsx`, `src/game/reducer.test.ts`。

### 7. リザルト画面のクリア演出を強化

**内容:** リザルト画面は（3の修正により）常にボスを倒した上で到達するようになったため、「クリアした」ことがより伝わるよう演出を強化した。🏆の絵文字と大きな金色の「ゲームクリア！」見出しを追加し、スコア表示も強調した。

**関連ファイル:** `src/screens/ResultScreen.tsx`, `src/screens/ResultScreen.test.tsx`（新規）。

### 8. バトル画面に現在のレベルを表示

**内容:** `GameState.level` も元から存在したが画面に表示されておらず、プレイヤーが今どの難易度にいるか分からなかった。`BattleScreen.tsx` に「レベル ${level}」の表示を追加した。

**関連ファイル:** `src/screens/BattleScreen.tsx`, `src/app/App.tsx`, `src/screens/BattleScreen.test.tsx`。

### 画面一覧の更新

Task 8で定義した画面一覧（Title / Battle / Result）に、上記6により **Defeated**（撃破後の中間画面）が加わる。実際の画面フローは以下の通り:

```
Title --START--> Battle --(敵を倒す, 非最終セグメント)--> Defeated --(タップ=CONTINUE)--> Battle（次の敵）
                     └--(ボス=最終セグメントを倒す)--> Result --(もう一度=RESTART)--> Battle
```

### 9. 敵撃破時に爆発エフェクトを追加

**内容:** `src/index.css` にTailwindのカスタムkeyframe `explode`（拡大しながらフェードアウト、0.6秒）を追加。💥の絵文字をこのアニメーションで表示し、`DefeatedScreen`（通常敵撃破）と`ResultScreen`（ボス撃破＝ゲームクリア）の両方で、敵グラフィック/トロフィーの上に重ねて表示する。

**関連ファイル:** `src/index.css`, `src/screens/DefeatedScreen.tsx`, `src/screens/ResultScreen.tsx`, それぞれのテストに `data-testid="explosion"` の存在確認を追加。

### 10. 正解・不正解フィードバックをアニメーション化し、数秒で消えるように変更

**症状:** 「せいかい！」「ざんねん…もういちど！」が静的に表示されたままだったため、不正解が連続すると同じテキストが変化なく表示され続け、新しく回答したこと自体が分かりにくかった。

**修正:** `src/index.css` にkeyframe `feedback-pop`（ポップイン→保持→フェードアウト、2.5秒）を追加し、`BattleScreen.tsx` のフィードバック表示に適用。さらに、フィードバックの`<span>`に `key={question.id}` を設定することで、**同じ判定結果（例: 不正解が連続）でも回答のたびにアニメーションが再スタートする**ようにした（`question.id`は不正解時も含め毎回の回答後に必ず新しい値になる）。

**関連ファイル:** `src/index.css`, `src/screens/BattleScreen.tsx`。

### 11. GitHub Pagesで公開

**内容:** 仕様書12章の「MVP公開方法: GitHub Pages」を実施。

- リポジトリ: `https://github.com/dsuket/numblade`（Public）
- 公開URL: `https://dsuket.github.io/numblade/`
- `vite.config.ts` に `base: '/numblade/'` を設定（プロジェクトページのURL構造に合わせてアセットパスを解決するため必須）。
- `.github/workflows/deploy.yml` を追加。`main` へのpush（および手動実行）のたびに `pnpm install` → `pnpm test` → `pnpm build` → `actions/upload-pages-artifact` → `actions/deploy-pages` を実行する。
- **ハマりどころ・判断事項:**
  - `package.json` の `packageManager: pnpm@11.21.0` はNode.js 22.13以上を要求するため、ワークフローの `actions/setup-node` は `node-version: 22` を指定する必要がある（20だと `pnpm install` 前段で `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite` エラーになる）。
  - GitHub PagesのSourceを初めて有効化する操作は、ワークフロー自身の `GITHUB_TOKEN`（`pages: write` 権限があっても）では実行できない（`Resource not accessible by integration` エラー）。リポジトリのSettings → Pages → Source を「GitHub Actions」に**人間が一度だけ手動で設定**する必要がある。`gh api` での書き込みは社内ルール上使用しないため、この手動設定はユーザーに依頼した。
  - `actions/configure-pages@v5` の `enablement: true` は上記の手動設定を代替できないが、無害なので残してある（Pages有効化後は特に影響しない）。

**関連ファイル:** `vite.config.ts`, `.github/workflows/deploy.yml`。
