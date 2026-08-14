# レベル反映スコア計算 & レベルリセットボタン 設計

## 背景・目的

現在のスコア計算（`scoreForAnswer`）は、コンボ数と回答速度倍率だけを見ており、難易度（`state.level`, 1〜6）は一切考慮していない。レベルが上がるほどスコアも上がるようにし、高難易度への挑戦にスコア面でも報酬を与える。

あわせて、`level` は `localStorage` に永続化され次回起動時にも引き継がれるため、「もう一度簡単なレベルからやり直したい」プレイヤー向けにレベルを `MIN_LEVEL` に戻すボタンをタイトル画面に追加する。

## 対象範囲

- `src/game/scoring.ts`: `levelFactor` を追加、`scoreForAnswer` にレベル引数を追加
- `src/game/reducer.ts`: `scoreForAnswer` の呼び出しを更新、`RESET_LEVEL` アクションを新設
- `src/screens/TitleScreen.tsx`: レベルリセットボタンを追加
- `src/app/App.tsx`: `TitleScreen` への `level` / `onResetLevel` の配線
- 上記に対応するテストファイル一式

## 設計詳細

### 1. レベル係数の算出（`src/game/scoring.ts`）

```ts
import type { DifficultyLevel } from './difficulty'

// level=1 を等倍(1.0)とし、level=6 で3.0倍になるよう線形に増加させる。
export function levelFactor(level: DifficultyLevel): number {
  return 1 + (level - 1) * 0.4
}
```

| level | 1   | 2   | 3   | 4   | 5   | 6   |
| ----- | --- | --- | --- | --- | --- | --- |
| 倍率  | 1.0 | 1.4 | 1.8 | 2.2 | 2.6 | 3.0 |

`scoreForAnswer` はレベル引数を受け取り、既存の「基本100点＋コンボマイルストーンボーナス」に速度倍率とレベル係数の両方を掛けた上で `Math.round()` する。

```ts
export function scoreForAnswer(combo: number, multiplier: number, level: DifficultyLevel): number {
  return Math.round((100 + (COMBO_BONUS[combo] ?? 0)) * multiplier * levelFactor(level))
}
```

### 2. reducer の変更（`src/game/reducer.ts`）

`answer()` 内の呼び出し（現 130行目付近）を、**その問題が出題された時点のレベル**（この回答による `nextLevel()` 適用前の `state.level`）で計算するよう変更する。

```ts
const score = state.score + scoreForAnswer(combo, multiplier, state.level)
```

`level`（回答後に `nextLevel()` で再計算される値）ではなく `state.level` を使う点に注意。これにより「レベルが上がった直後の1問目」から新レベルの倍率が適用されるのではなく、「その問題を解いた時点で有効だったレベル」の倍率が適用される。

#### レベルリセットアクション

```ts
export type GameAction =
  | { type: 'START' }
  | { type: 'ANSWER'; value: number; elapsedMs: number }
  | { type: 'TIMEOUT' }
  | { type: 'CONTINUE' }
  | { type: 'RESTART' }
  | { type: 'RESET_LEVEL' }
```

新設する `resetLevel()`:

```ts
function resetLevel(state: GameState): GameState {
  const level = MIN_LEVEL
  saveProgress({ level, highScore: state.highScore })
  return { ...state, level }
}
```

- `screen === 'title'` 以外からの呼び出しは想定しないが、他アクション（`answer`/`timeout`）と同様に安全のため `state.screen !== 'title'` なら何もしないガードを入れる
- ハイスコアは変更しない
- `gameReducer` の `switch` に `case 'RESET_LEVEL': return resetLevel(state)` を追加

### 3. タイトル画面のボタン（`src/screens/TitleScreen.tsx`）

```tsx
interface TitleScreenProps {
  level: DifficultyLevel
  highScore: number
  onStart: () => void
  onResetLevel: () => void
}
```

- `level > MIN_LEVEL` のときだけ「レベルをリセット」ボタンを表示する（初回プレイや既にレベル1のプレイヤーには出さない）
- スタートボタン（プライマリCTA、`bg-[#3a86ff]` の大きいボタン）とは視覚的に区別する。既存の配色を踏襲しつつ、小さめ・アウトライン系のセカンダリスタイルにする（誤操作防止。確認ダイアログは設けない — シンプルなゲームであり、押し間違えてもレベル1に戻るだけで大きな不利益はないため）

```tsx
{level > MIN_LEVEL && (
  <button
    type="button"
    className="min-h-10 min-w-[160px] rounded-xl border border-[#3a86ff] bg-transparent text-sm text-[#3a86ff] cursor-pointer"
    onClick={onResetLevel}
  >
    レベルをリセット
  </button>
)}
```

### 4. App.tsx の配線

```tsx
<TitleScreen
  level={state.level}
  highScore={state.highScore}
  onStart={() => dispatch({ type: 'START' })}
  onResetLevel={() => dispatch({ type: 'RESET_LEVEL' })}
/>
```

## テスト方針（TDD）

- **`scoring.test.ts`**:
  - `levelFactor`: level 1〜6 それぞれの倍率値
  - `scoreForAnswer`: level 引数を渡した場合の計算結果（既存テストは level=1 相当の呼び出しに更新し、加えて level>1 のケースを追加）
- **`reducer.test.ts`**:
  - レベルが1より高い状態でのスコア計算が `levelFactor` を反映していること
  - レベルが変動した直後の1問は「出題時点のレベル」の倍率で計算されること（変動後の新レベルではないこと）を確認するケースを追加
  - 既存の「10問連続正解でコンボボーナス込み1450点」テスト（`finishes the game after all 10 questions answered correctly, with combo-bonus score`）は、3連続正解ごとにレベルが上がる適応ルールにより、4問目以降は level 2 以上（`levelFactor` > 1.0）で計算されることになる。**期待値 `1450` は変わる**ため、実装後に実際の計算結果（各問の level 遷移: 1問目〜3問目が level 1、4問目〜6問目が level 2、7問目〜9問目が level 3、10問目が level 4）を手計算またはテスト出力で確認し、正しい値に更新する
  - `RESET_LEVEL`: `level` が `MIN_LEVEL` になること、`highScore` は変化しないこと、`saveProgress` が呼ばれること、`screen !== 'title'` では無視されること
- **`TitleScreen.test.tsx`**:
  - `level === MIN_LEVEL` のときボタンが表示されないこと
  - `level > MIN_LEVEL` のときボタンが表示され、クリックで `onResetLevel` が呼ばれること
- **`App.test.tsx`**: `RESET_LEVEL` の dispatch 配線（クリックで実際に `state.level` が変わること）

## 影響しない範囲

- `BattleScreen.tsx`, `DefeatedScreen.tsx`, `ResultScreen.tsx`, `GameOverScreen.tsx` は変更なし
- `damagePerCorrectAnswer`（`battle.ts`）や敵ダメージ計算は変更なし（レベル係数はスコアのみに適用し、ダメージには適用しない）
- `nextLevel()` の適応ロジック（`difficulty.ts`）自体は変更なし
- 穴埋め計算（`◼️ × 8 = 24` 形式の出題）は別依頼として扱う（本設計の対象外）
