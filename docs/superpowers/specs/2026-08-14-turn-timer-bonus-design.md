# 各ターンのタイマー & スピードボーナス/タイムアウトペナルティ 設計

## 背景・目的

各問題（ターン）に経過時間を可視化するカウントアップタイマーを追加し、回答の速さに応じてスコア・敵ダメージへのボーナス倍率を与える。逆に一定時間内に回答しなかった場合はプレイヤーがダメージを受ける（強制ミス）。

- 5秒以内に正解 → ×1.5倍（"Critical!"）
- 10秒以内に正解 → ×1.2倍（"Nice!"）
- 10〜20秒で正解 → 等倍（ボーナスなし）
- 20秒経過しても未回答 → 自動的に強制ミス扱い（通常の不正解と同じ挙動）

## 対象範囲

- `src/game/scoring.ts`: ボーナス倍率の判定・算出関数を追加
- `src/game/reducer.ts`: `ANSWER` アクションに `elapsedMs` を追加、`TIMEOUT` アクションを新設
- `src/game/battle.ts`: `damagePerCorrectAnswer` に倍率を適用できる形に変更（または呼び出し側で倍率を掛ける）
- `src/app/App.tsx`: 問題ごとの経過時間管理（表示用インターバル、20秒タイムアウト用タイマー）
- `src/screens/BattleScreen.tsx`: タイマー表示、ボーナスエフェクト（Critical!/Nice!）表示
- `src/index.css`: ボーナスエフェクト用のフェードアニメーション（`feedback-pop` 系を踏襲）
- 上記に対応するテストファイル一式

## 設計詳細

### 1. ボーナス倍率の算出（`src/game/scoring.ts`）

```ts
export type BonusTier = 'critical' | 'nice' | null

// elapsedMs: 問題が表示されてから回答するまでの経過時間（ミリ秒）
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
```

境界値は「以下」で判定する（5000ms ちょうどは critical、10000ms ちょうどは nice）。

`scoreForAnswer` は倍率を受け取り、既存の「基本100点＋コンボマイルストーンボーナス」の合計に倍率を掛けた上で `Math.round()` する形に変更する。

```ts
export function scoreForAnswer(combo: number, multiplier: number): number {
  return Math.round((100 + (COMBO_BONUS[combo] ?? 0)) * multiplier)
}
```

`battle.ts` の `damagePerCorrectAnswer` も同様に倍率を受け取り、`Math.ceil()` で丸める（既存の丸め方針を踏襲）。

```ts
export function damagePerCorrectAnswer(segment: EnemySegment, multiplier: number): number {
  return Math.ceil((segment.maxHp / segment.questionCount) * multiplier)
}
```

倍率はどちらも**正解した場合のみ**渡す。不正解・`TIMEOUT` では倍率計算自体を行わない（＝ダメージ・スコアともに0のまま、現状の不正解処理を変更しない）。

### 2. reducer の変更（`src/game/reducer.ts`）

```ts
export type GameAction =
  | { type: 'START' }
  | { type: 'ANSWER'; value: number; elapsedMs: number }
  | { type: 'TIMEOUT' }
  | { type: 'CONTINUE' }
  | { type: 'RESTART' }
```

`answer()`:
- `correct` が `true` のときのみ `bonusTierForElapsed(elapsedMs)` → `multiplierForTier()` を計算し、`scoreForAnswer(combo, multiplier)` / `damagePerCorrectAnswer(segment, multiplier)` に渡す
- `correct` が `false` のときは倍率 `1` 扱い（＝現状通りスコア・ダメージともに0）
- 戻り値の `GameState` に `bonusTier: BonusTier` を追加し、`BattleScreen` がエフェクト表示に使えるようにする（正解でボーナスがない場合や不正解の場合は `null`）

新設する `timeout()`:
- `state.screen !== 'battle'` なら何もしない（既存の `answer()` と同じガード）
- 挙動は既存の「不正解」処理と完全に共通化する。具体的には `answer()` 内の不正解パス（コンボリセット、`applyMiss` によるHP-1、`lastAnswerCorrect: false`、次の問題生成 or ゲームオーバー遷移）を共通の内部関数に切り出し、`answer()` の不正解時と `timeout()` の両方から呼ぶ
- `bonusTier` は `null`

```ts
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      return startBattle(state)
    case 'ANSWER':
      return answer(state, action.value, action.elapsedMs)
    case 'TIMEOUT':
      return timeout(state)
    case 'CONTINUE':
      return continueAfterDefeat(state)
    case 'RESTART':
      return startBattle(state)
    default:
      return state
  }
}
```

`GameState` に `bonusTier: BonusTier` を追加し、`initGameState()` / `startBattle()` / `continueAfterDefeat()` では `null` にリセットする。

### 3. App.tsx の時間管理

- 問題ごとの経過時間の起点となる `questionStartedAtRef`（`useRef<number>`）を、`state.questionsAnswered` が変化するたび（＝新しい問題が出るたび）に `Date.now()` でリセットする `useEffect`
- 同じ `useEffect` 内で、
  - 表示用: `setInterval(1000ms)` で `elapsedSeconds`（`useState<number>`）を更新
  - タイムアウト用: `setTimeout(20000ms)` で `dispatch({ type: 'TIMEOUT' })`
- 依存配列は `[state.questionsAnswered, state.screen]`。`state.screen !== 'battle'` の間はタイマーを仕込まない（`useEffect` の先頭で早期リターン）
- クリーンアップで `clearInterval` / `clearTimeout` を必ず呼ぶ（キリング・ブロー用リンガーと同じ考え方）
- `onAnswer` は `elapsedMs = Date.now() - questionStartedAtRef.current` を計算し、`dispatch({ type: 'ANSWER', value, elapsedMs })` する

`BattleScreen` に新規 props `elapsedSeconds: number` と `bonusTier: BonusTier` を渡す。

### 4. UI表示（`src/screens/BattleScreen.tsx`）

- タイマー表示: HPバー付近に「⏱ {elapsedSeconds}秒」のような表示を追加（整数秒、1秒ごと更新）
- ボーナスエフェクト: 正解時（`lastAnswerCorrect === true`）かつ `bonusTier` が `'critical'` / `'nice'` のとき、既存の斬撃エフェクト・「せいかい！」フィードバックと同様の一過性オーバーレイとして、`Critical!`（critical時）/ `Nice!`（nice時）のテキストを表示する
  - `bonusTier === null`（10〜20秒での正解）の場合は何も表示せず、通常の「せいかい！」のみ
  - `answerSeq` をキーにして、既存の `feedback-pop` アニメーションと同様に毎回リスタートさせる

`src/index.css` に、`feedback-pop` を踏襲したフェードアウト系の keyframe を追加する（新規名: `bonus-pop` など）。

### 5. 既存箇所への影響

- `answer()` の関数シグネチャが変わるため、`src/game/reducer.test.ts` の `dispatch({ type: 'ANSWER', value: ... })` を呼んでいる箇所はすべて `elapsedMs` を渡すよう更新する（ボーナスなし相当の値、例: `12000` を明示的に渡すヘルパーにする）
- `App.tsx` から `BattleScreen` への呼び出し箇所、および `BattleScreen.test.tsx` の props も `elapsedSeconds` / `bonusTier` の追加に伴い更新する

## テスト方針（TDD）

- **`scoring.test.ts`**: `bonusTierForElapsed` の境界値（5000ms/5001ms/10000ms/10001ms）、`multiplierForTier` の3パターン、`scoreForAnswer` の倍率適用と丸め
- **`battle.test.ts`**: `damagePerCorrectAnswer` の倍率適用と丸め
- **`reducer.test.ts`**:
  - `ANSWER` に `elapsedMs` を渡し、critical/nice/ボーナスなしでスコア・敵ダメージが正しく変わることを確認
  - `TIMEOUT` アクションが通常の不正解と同じ結果（コンボリセット、HP-1、次の問題）になることを確認
  - `TIMEOUT` でHPが0になったら `gameover` に遷移すること
  - `TIMEOUT` は `screen !== 'battle'` のときは無視されること
- **`BattleScreen.test.tsx`**: `elapsedSeconds` の表示、`bonusTier` に応じた `Critical!`/`Nice!`/非表示の切り替え
- **`App.test.tsx`**: vitest の fake timer を使い、20秒経過で `TIMEOUT` が dispatch されること、新しい問題が出るとタイマーがリセットされること、`battle` 以外の画面ではタイムアウトタイマーが動かないこと

## 影響しない範囲

- `Enemy.tsx`, `DefeatedScreen.tsx`, `ResultScreen.tsx`, `GameOverScreen.tsx`, `ComboDisplay.tsx`, `HpBar.tsx` は変更なし
- 斬撃エフェクト・シェイクエフェクトの既存表示条件・アニメーションは変更なし
- コンボ判定・レベル判定（`difficulty.ts`）のロジックは変更なし
