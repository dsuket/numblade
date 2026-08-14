# NUMBLADE Phase 0: 試作(Prototype) 実装計画

> **エージェント向け:** このプランをタスクごとに実行する際は superpowers:subagent-driven-development（推奨）または superpowers:executing-plans を使用すること。各ステップはチェックボックス（`- [ ]`）で進捗管理する。

**目的:** プロジェクトの雛形と、コア機能を担う純粋関数モジュール（問題生成・戦闘ダメージ・スコア計算）をユニットテスト付きで構築し、最後に1体の敵と戦える最小プレイアブル画面を組み上げて「計算＝攻撃」ループが動作することを確認する。

**アーキテクチャ:** クライアントサイドSPA（Vite + React + TypeScript）。ゲームのドメインロジック（`src/game/*`）はReactに依存しない純粋関数・型として実装し、Reactを描画せずに単体テストできるようにする。この試作の `App.tsx` はローカルの `useState` からこれらの純粋関数を呼び出す構成とし、Phase 1で `useReducer` ベースの状態機械（全10問ループ対応）に置き換える。

**技術スタック:** TypeScript, React 18, Vite, Vitest, @testing-library/react, CSS Modules方式（コンポーネントごとのCSSファイル。Tailwindは仕様書5章の「チームの好みで選択」を踏まえ、雛形をシンプルに保つため今回は採用しない）。

## 全体制約（Global Constraints）

- 対象仕様書: NUMBLADE プロジェクト計画書・MVP仕様書 v0.1（2026-08-14）。
- ログイン・サーバーAPI・外部DBなし。クライアントのみで完結（仕様書2.2）。
- MVPのUIロジックに画像アセットは不要。画像は装飾のみに使い、ゲーム進行に必要な情報を画像に依存させない（仕様書4.2）。
- ゲームロジックはReact非依存の純粋関数を優先し、単体テスト可能にする（仕様書7章）。
- 回答ボタンは最低64px以上のタッチ領域を確保する（仕様書4.3）。このタスクおよび以降のボタン関連実装すべてに適用。
- パッケージマネージャ: npm。
- ソースコード中のコメントは英語で記述する（コード自体・UI文言は日本語）。

---

### Task 1: プロジェクト雛形作成（Vite + React + TypeScript + Vitest）

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/App.css`
- Create: `src/vite-env.d.ts`
- Create: `src/test/setup.ts`
- Create: `src/app/App.test.tsx`
- Create: `.gitignore`

**Interfaces:**
- Produces: `App` Reactコンポーネント（`src/app/App.tsx` のdefault export）。`src/main.tsx` から `#root` にレンダリングされる。

- [ ] **Step 1: `package.json` を作成する**

```json
{
  "name": "numblade",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^24.1.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.0",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: `tsconfig.json` を作成する**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: `tsconfig.node.json` を作成する**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: `vite.config.ts` を作成する**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 5: `index.html` を作成する**

```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>NUMBLADE</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: `src/vite-env.d.ts` を作成する**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 7: `src/test/setup.ts` を作成する**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 8: `src/main.tsx` を作成する**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './app/App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 9: 最小の `src/app/App.tsx` を作成する（Task 6で置き換える仮実装）**

```tsx
export default function App() {
  return <div className="app">NUMBLADE</div>
}
```

- [ ] **Step 10: `src/app/App.css` を作成する**

```css
.app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0e1a;
  color: #e6f1ff;
  font-family: system-ui, sans-serif;
}
```

- [ ] **Step 11: 失敗するスモークテスト `src/app/App.test.tsx` を書く**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the NUMBLADE title', () => {
    render(<App />)
    expect(screen.getByText('NUMBLADE')).toBeInTheDocument()
  })
})
```

- [ ] **Step 12: `.gitignore` を作成する**

```
node_modules
dist
.DS_Store
```

- [ ] **Step 13: 依存パッケージをインストールする**

実行: `npm install`
期待結果: エラーなくインストールが完了し、`package-lock.json` が生成される。

- [ ] **Step 14: テストを実行して成功を確認する**

実行: `npm test`
期待結果: PASS — `App renders the NUMBLADE title`。

- [ ] **Step 15: コミットする**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts index.html src .gitignore
git commit -m "chore: scaffold Vite + React + TypeScript + Vitest project"
```

---

### Task 2: ゲームのドメインモデル定義

**Files:**
- Create: `src/game/models.ts`

**Interfaces:**
- Produces: `Operation` 型、`Question` 型、`Enemy` 型 — Task 3, Task 4 で使用する。

- [ ] **Step 1: `src/game/models.ts` を書く**

```ts
export type Operation = 'multiply' | 'divide'

export interface Question {
  id: string
  expression: string
  answer: number
  choices: number[]
}

export interface Enemy {
  id: string
  name: string
  maxHp: number
  hp: number
}
```

- [ ] **Step 2: コミットする**

```bash
git add src/game/models.ts
git commit -m "feat: add core game domain models"
```

---

### Task 3: 問題生成ロジック（掛け算・1桁×1桁 — 試作の範囲）

**Files:**
- Create: `src/game/questionGenerator.ts`
- Test: `src/game/questionGenerator.test.ts`

**Interfaces:**
- Consumes: `src/game/models.ts`（Task 2）の `Question`。
- Produces: `generateQuestion(digitsA: number, digitsB: number): Question` — Task 6（App実装）およびPhase 1 Task 2（拡張版ジェネレーター）で使用する。

- [ ] **Step 1: 失敗するテスト `src/game/questionGenerator.test.ts` を書く**

```ts
import { describe, expect, it } from 'vitest'
import { generateQuestion } from './questionGenerator'

describe('generateQuestion', () => {
  it('produces an expression whose evaluated answer matches `answer`', () => {
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion(1, 1)
      const [a, , b] = q.expression.split(' ')
      expect(Number(a) * Number(b)).toBe(q.answer)
    }
  })

  it('produces exactly 4 choices with no duplicates', () => {
    const q = generateQuestion(1, 1)
    expect(q.choices).toHaveLength(4)
    expect(new Set(q.choices).size).toBe(4)
  })

  it('includes the correct answer among the choices', () => {
    const q = generateQuestion(1, 1)
    expect(q.choices).toContain(q.answer)
  })

  it('respects digit ranges for each operand', () => {
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion(1, 1)
      const [a, , b] = q.expression.split(' ').map(Number)
      expect(a).toBeGreaterThanOrEqual(1)
      expect(a).toBeLessThanOrEqual(9)
      expect(b).toBeGreaterThanOrEqual(1)
      expect(b).toBeLessThanOrEqual(9)
    }
  })
})
```

- [ ] **Step 2: テストを実行して失敗を確認する**

実行: `npm test -- questionGenerator`
期待結果: FAIL — `Cannot find module './questionGenerator'`。

- [ ] **Step 3: 実装 `src/game/questionGenerator.ts` を書く**

```ts
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
```

- [ ] **Step 4: テストを実行して成功を確認する**

実行: `npm test -- questionGenerator`
期待結果: PASS — 全4テスト。

- [ ] **Step 5: コミットする**

```bash
git add src/game/questionGenerator.ts src/game/questionGenerator.test.ts
git commit -m "feat: add question generator for single-digit multiplication"
```

---

### Task 4: 戦闘ロジック（ダメージ適用）

**Files:**
- Create: `src/game/battle.ts`
- Test: `src/game/battle.test.ts`

**Interfaces:**
- Consumes: `src/game/models.ts`（Task 2）の `Enemy`。
- Produces: `applyDamage(enemy: Enemy, amount: number): Enemy`, `isDefeated(enemy: Enemy): boolean` — Task 6（App実装）およびPhase 1 Task 3（reducer）で使用する。

- [ ] **Step 1: 失敗するテスト `src/game/battle.test.ts` を書く**

```ts
import { describe, expect, it } from 'vitest'
import { applyDamage, isDefeated } from './battle'
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
```

- [ ] **Step 2: テストを実行して失敗を確認する**

実行: `npm test -- battle`
期待結果: FAIL — `Cannot find module './battle'`。

- [ ] **Step 3: 実装 `src/game/battle.ts` を書く**

```ts
import type { Enemy } from './models'

export function applyDamage(enemy: Enemy, amount: number): Enemy {
  return { ...enemy, hp: Math.max(0, enemy.hp - amount) }
}

export function isDefeated(enemy: Enemy): boolean {
  return enemy.hp <= 0
}
```

- [ ] **Step 4: テストを実行して成功を確認する**

実行: `npm test -- battle`
期待結果: PASS — 全5テスト。

- [ ] **Step 5: コミットする**

```bash
git add src/game/battle.ts src/game/battle.test.ts
git commit -m "feat: add battle damage logic"
```

---

### Task 5: スコア・コンボロジック（基礎ルール、連続ボーナスはPhase 1で追加）

**Files:**
- Create: `src/game/scoring.ts`
- Test: `src/game/scoring.test.ts`

**Interfaces:**
- Produces: `nextCombo(current: number, correct: boolean): number`, `scoreForAnswer(combo: number): number`（今は基礎+100点のみ。連続ボーナスの閾値処理はPhase 1 Task 4で追加）— Task 6およびPhase 1 Task 4で使用する。

- [ ] **Step 1: 失敗するテスト `src/game/scoring.test.ts` を書く**

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
  it('awards 100 points regardless of combo (base rule)', () => {
    expect(scoreForAnswer(0)).toBe(100)
    expect(scoreForAnswer(7)).toBe(100)
  })
})
```

- [ ] **Step 2: テストを実行して失敗を確認する**

実行: `npm test -- scoring`
期待結果: FAIL — `Cannot find module './scoring'`。

- [ ] **Step 3: 実装 `src/game/scoring.ts` を書く**

```ts
export function nextCombo(current: number, correct: boolean): number {
  return correct ? current + 1 : 0
}

export function scoreForAnswer(_combo: number): number {
  return 100
}
```

- [ ] **Step 4: テストを実行して成功を確認する**

実行: `npm test -- scoring`
期待結果: PASS — 全3テスト。

- [ ] **Step 5: コミットする**

```bash
git add src/game/scoring.ts src/game/scoring.test.ts
git commit -m "feat: add base scoring and combo logic"
```

---

### Task 6: 最小プレイアブル画面（敵1体との戦闘）

**Files:**
- Create: `src/components/ChoiceButton.tsx`
- Create: `src/components/ChoiceButton.css`
- Create: `src/components/HpBar.tsx`
- Create: `src/components/HpBar.css`
- Create: `src/components/QuestionPanel.tsx`
- Create: `src/components/QuestionPanel.css`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`

**Interfaces:**
- Consumes: `generateQuestion`（Task 3）, `applyDamage`/`isDefeated`（Task 4）, `nextCombo`/`scoreForAnswer`（Task 5）, `Question`/`Enemy`（Task 2）。
- Produces: プレイ可能な `App` コンポーネント — Phase 1では内部の状態管理をTask 6の reducer に置き換えるが、ここで作る `ChoiceButton`・`HpBar`・`QuestionPanel` はそのまま再利用する。

- [ ] **Step 1: `src/components/ChoiceButton.tsx` を書く**

```tsx
import './ChoiceButton.css'

interface ChoiceButtonProps {
  value: number
  onSelect: (value: number) => void
  disabled?: boolean
}

export default function ChoiceButton({ value, onSelect, disabled }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      className="choice-button"
      onClick={() => onSelect(value)}
      disabled={disabled}
    >
      {value}
    </button>
  )
}
```

- [ ] **Step 2: `src/components/ChoiceButton.css` を書く**

```css
.choice-button {
  min-height: 64px;
  font-size: 1.5rem;
  border-radius: 12px;
  border: 2px solid #3a86ff;
  background: #101a2e;
  color: #e6f1ff;
  cursor: pointer;
}

.choice-button:active {
  background: #3a86ff;
}

.choice-button:disabled {
  opacity: 0.5;
  cursor: default;
}
```

- [ ] **Step 3: `src/components/HpBar.tsx` を書く**

```tsx
import './HpBar.css'

interface HpBarProps {
  hp: number
  maxHp: number
}

export default function HpBar({ hp, maxHp }: HpBarProps) {
  const percent = maxHp === 0 ? 0 : Math.max(0, Math.min(100, (hp / maxHp) * 100))
  return (
    <div className="hp-bar" role="progressbar" aria-valuenow={hp} aria-valuemin={0} aria-valuemax={maxHp}>
      <div className="hp-bar-fill" style={{ width: `${percent}%` }} />
      <span className="hp-bar-label">{hp} / {maxHp}</span>
    </div>
  )
}
```

- [ ] **Step 4: `src/components/HpBar.css` を書く**

```css
.hp-bar {
  position: relative;
  width: 100%;
  height: 20px;
  background: #1e2a44;
  border-radius: 10px;
  overflow: hidden;
}

.hp-bar-fill {
  height: 100%;
  background: #ff4d6d;
  transition: width 0.3s ease;
}

.hp-bar-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: #e6f1ff;
}
```

- [ ] **Step 5: `src/components/QuestionPanel.tsx` を書く**

```tsx
import ChoiceButton from './ChoiceButton'
import type { Question } from '../game/models'
import './QuestionPanel.css'

interface QuestionPanelProps {
  question: Question
  onAnswer: (value: number) => void
  disabled?: boolean
}

export default function QuestionPanel({ question, onAnswer, disabled }: QuestionPanelProps) {
  return (
    <div className="question-panel">
      <div className="question-expression">{question.expression} = ?</div>
      <div className="question-choices">
        {question.choices.map((choice) => (
          <ChoiceButton key={choice} value={choice} onSelect={onAnswer} disabled={disabled} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: `src/components/QuestionPanel.css` を書く**

```css
.question-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.question-expression {
  font-size: 2rem;
  color: #e6f1ff;
}

.question-choices {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  width: 100%;
  max-width: 320px;
}
```

- [ ] **Step 7: `src/app/App.tsx` をプレイ可能な単体敵ループに置き換える**

```tsx
import { useState } from 'react'
import HpBar from '../components/HpBar'
import QuestionPanel from '../components/QuestionPanel'
import { applyDamage, isDefeated } from '../game/battle'
import type { Enemy } from '../game/models'
import { generateQuestion } from '../game/questionGenerator'
import { nextCombo, scoreForAnswer } from '../game/scoring'
import './App.css'

const DAMAGE_PER_CORRECT_ANSWER = 25

function makeEnemy(): Enemy {
  return { id: 'prototype-enemy', name: 'スライム', maxHp: 100, hp: 100 }
}

export default function App() {
  const [enemy, setEnemy] = useState<Enemy>(makeEnemy)
  const [question, setQuestion] = useState(() => generateQuestion(1, 1))
  const [combo, setCombo] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)

  const defeated = isDefeated(enemy)

  function handleAnswer(value: number) {
    if (defeated) return
    const correct = value === question.answer
    setFeedback(correct ? 'correct' : 'incorrect')
    setCombo((prev) => nextCombo(prev, correct))

    if (correct) {
      setScore((prev) => prev + scoreForAnswer(combo))
      setEnemy((prev) => applyDamage(prev, DAMAGE_PER_CORRECT_ANSWER))
    }

    setQuestion(generateQuestion(1, 1))
  }

  return (
    <div className="app">
      <h1>NUMBLADE</h1>
      {defeated ? (
        <p data-testid="victory-message">敵を倒した！ スコア: {score}</p>
      ) : (
        <>
          <HpBar hp={enemy.hp} maxHp={enemy.maxHp} />
          <p>コンボ: {combo} / スコア: {score}</p>
          {feedback && <p data-testid="feedback">{feedback === 'correct' ? '正解！' : '不正解'}</p>}
          <QuestionPanel question={question} onAnswer={handleAnswer} />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 8: `src/app/App.test.tsx` をプレイループの振る舞いテストに置き換える**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the NUMBLADE title and a question', () => {
    render(<App />)
    expect(screen.getByText('NUMBLADE')).toBeInTheDocument()
    expect(screen.getByText(/=\s*\?/)).toBeInTheDocument()
  })

  it('shows feedback after selecting a choice', () => {
    render(<App />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(screen.getByTestId('feedback')).toBeInTheDocument()
  })
})
```

- [ ] **Step 9: テストを実行して成功を確認する**

実行: `npm test`
期待結果: PASS — 全スイート（App, questionGenerator, battle, scoring）。

- [ ] **Step 10: 手動確認**

実行: `npm run dev`、表示されたローカルURLをブラウザで開き、選択肢ボタンを連打して敵を倒し、勝利メッセージが表示されることを確認する。

- [ ] **Step 11: コミットする**

```bash
git add src/components src/app/App.tsx src/app/App.test.tsx src/app/App.css
git commit -m "feat: wire minimal playable single-enemy prototype screen"
```

---

## Phase 0 完了条件（Definition of Done）

- [ ] `npm test` が失敗なく通ること。
- [ ] `npm run dev` で表示される画面で、問題に正解すると敵にダメージが入り、HPが0になると勝利メッセージが表示されること。
- [ ] `src/game/*` の各モジュールがReactをimportしていない（純粋関数のみ）こと。
