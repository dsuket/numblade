# 攻撃時スラッシュエフェクト & ミス時シェイクエフェクト Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** バトル画面で、正解時に敵へ斬撃エフェクトを表示し、不正解時に敵を左右にシェイクさせる。

**Architecture:** `BattleScreen` が `lastAnswerCorrect` と `question.id` を既に props で持っているため、`Enemy` を relative コンテナで包み、条件付きでオーバーレイ／CSSクラスを重ねるだけで完結する。新しい state・reducer 変更は不要。CSS keyframe アニメーションは `src/index.css` に既存の `explode` / `feedback-pop` と同じ流儀で追加する。

**Tech Stack:** React + TypeScript, Tailwind CSS v4 (`animate-[keyframe_...]` 任意値ユーティリティ), Vitest + Testing Library

## Global Constraints

- 演出は絵文字 + CSS keyframe アニメーションで実装する（既存の `explode` エフェクトと同じ路線）。SVG描画などのリッチな表現は使わない。
- 斬撃エフェクトは `lastAnswerCorrect === true` の時のみ表示し、`data-testid="slash-effect"` を付与する。
- シェイクは `lastAnswerCorrect === false` の時のみ、敵のラッパー要素に付与する。
- `Enemy.tsx`, `DefeatedScreen.tsx`, `ResultScreen.tsx`, `reducer.ts`, `battle.ts` は変更しない。
- 参照spec: `docs/superpowers/specs/2026-08-14-attack-miss-effects-design.md`

---

### Task 1: 斬撃エフェクトとシェイクエフェクトを BattleScreen に実装する

**Files:**
- Modify: `src/index.css`（末尾に `slash` / `shake` keyframe を追加）
- Modify: `src/screens/BattleScreen.tsx:32-33`（`<Enemy>` を relative ラッパーで包み、オーバーレイとシェイククラスを追加）
- Test: `src/screens/BattleScreen.test.tsx`

**Interfaces:**
- Consumes: `BattleScreen` の既存 props `lastAnswerCorrect: boolean | null`, `question: Question`（変更なし）
- Produces: なし（末端のUIコンポーネント。他タスクはこのタスクに依存しない）

- [ ] **Step 1: 失敗するテストを書く**

`src/screens/BattleScreen.test.tsx` の `describe('BattleScreen', () => { ... })` ブロック内、最後の `it(...)` の後に以下を追加する:

```tsx
  it('shows a slash effect overlay when the answer is correct', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        level={1}
        combo={1}
        score={100}
        isBoss={false}
        lastAnswerCorrect={true}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.getByTestId('slash-effect')).toBeInTheDocument()
  })

  it('shows no slash effect when the answer is incorrect', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        lastAnswerCorrect={false}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.queryByTestId('slash-effect')).not.toBeInTheDocument()
  })

  it('shows no slash effect before any answer has been given', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        lastAnswerCorrect={null}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.queryByTestId('slash-effect')).not.toBeInTheDocument()
  })

  it('shakes the enemy when the answer is incorrect', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        lastAnswerCorrect={false}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.getByTestId('enemy-shake-wrapper').className).toContain('animate-[shake')
  })

  it('does not shake the enemy when the answer is correct', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        level={1}
        combo={1}
        score={100}
        isBoss={false}
        lastAnswerCorrect={true}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.getByTestId('enemy-shake-wrapper').className).not.toContain('animate-[shake')
  })
```

- [ ] **Step 2: テストを実行し、失敗することを確認する**

Run: `pnpm vitest run src/screens/BattleScreen.test.tsx`
Expected: 新規5件が `getByTestId`/`className` の対象要素が見つからず FAIL する（既存5件は引き続き PASS）

- [ ] **Step 3: CSS keyframe を追加する**

`src/index.css` の末尾（既存の `feedback-pop` keyframe の後）に追記する:

```css

@keyframes slash {
  0% {
    transform: scale(0.5) rotate(-20deg);
    opacity: 0;
  }
  30% {
    transform: scale(1.3) rotate(15deg);
    opacity: 1;
  }
  100% {
    transform: scale(1.6) rotate(15deg);
    opacity: 0;
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-8px);
  }
  40% {
    transform: translateX(8px);
  }
  60% {
    transform: translateX(-6px);
  }
  80% {
    transform: translateX(4px);
  }
}
```

- [ ] **Step 4: BattleScreen を実装する**

`src/screens/BattleScreen.tsx` の `<Enemy enemy={enemy} isBoss={isBoss} />` の行（既存の `<span className="text-[#e6f1ff]/70 text-sm">レベル {level}</span>` の直後）を、以下に置き換える:

```tsx
      <div className="relative" key={question.id}>
        <div
          data-testid="enemy-shake-wrapper"
          className={lastAnswerCorrect === false ? 'animate-[shake_0.4s_ease-in-out]' : undefined}
        >
          <Enemy enemy={enemy} isBoss={isBoss} />
        </div>
        {lastAnswerCorrect === true && (
          <span
            data-testid="slash-effect"
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-6xl animate-[slash_0.35s_ease-out_forwards]"
          >
            ⚔️
          </span>
        )}
      </div>
```

- [ ] **Step 5: テストを実行し、すべて通ることを確認する**

Run: `pnpm vitest run src/screens/BattleScreen.test.tsx`
Expected: 全10件 PASS

- [ ] **Step 6: 全体テストスイートを実行し、既存への影響がないことを確認する**

Run: `pnpm vitest run`
Expected: 全ファイル PASS（56件 + 新規5件 = 61件）

- [ ] **Step 7: コミット**

```bash
git add src/index.css src/screens/BattleScreen.tsx src/screens/BattleScreen.test.tsx
git commit -m "feat: add slash effect on hit and shake effect on miss"
```
