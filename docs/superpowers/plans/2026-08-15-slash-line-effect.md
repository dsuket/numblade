# White Slash-Line Effect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a white diagonal slash-line effect that plays alongside the existing 🗡️ sweep on a correct answer.

**Architecture:** A new sibling element next to the existing `slash-effect` span in `BattleScreen.tsx`, sharing the same `lastAnswerCorrect === true` condition and parent `key={answerSeq}` wrapper (so visibility, remount-on-answer, and killing-blow linger behavior are inherited for free). A new CSS keyframe (`slash-line`) in `src/index.css` drives the animation, matching the existing `slash` keyframe's `0.35s ease-out forwards` timing so both effects fire together.

**Tech Stack:** React (TSX), Tailwind CSS (arbitrary `animate-[...]` utility), Vitest + React Testing Library.

## Global Constraints

- Reuse the existing `lastAnswerCorrect === true` condition and the parent `<div className="relative" key={answerSeq}>` wrapper — do not introduce new state, props, or timing logic.
- Animation duration/easing must be `0.35s ease-out forwards`, identical to the existing `slash` keyframe, so the two effects are synchronized.
- Do not modify `src/game/reducer.ts`, `src/app/App.tsx`, `src/app/App.test.tsx`, or `src/components/Enemy.tsx`.
- Test-first: write the failing test before the implementation for each behavior.

---

### Task 1: White slash-line effect in BattleScreen

**Files:**
- Modify: `src/screens/BattleScreen.tsx` (add the new element next to the existing `slash-effect` span, inside the `<div className="relative" key={answerSeq}>` block, around line 56-64)
- Modify: `src/index.css` (add the `slash-line` keyframe, alongside the existing `slash` keyframe at line 39-52)
- Test: `src/screens/BattleScreen.test.tsx` (add cases alongside the existing `slash-effect` tests at lines 132-190)

**Interfaces:**
- Consumes: `lastAnswerCorrect: boolean | null` prop already on `BattleScreenProps` (`src/screens/BattleScreen.tsx:18`). No new props.
- Produces: a `data-testid="slash-line-effect"` element, present in the DOM exactly when `lastAnswerCorrect === true` (same visibility contract as the existing `data-testid="slash-effect"`).

- [ ] **Step 1: Write the failing tests**

In `src/screens/BattleScreen.test.tsx`, add these three tests directly after the existing `it('shows no slash effect before any answer has been given', ...)` block (after line 190, still inside the same `describe`):

```tsx
  it('shows a slash-line effect overlay when the answer is correct', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={1}
        score={100}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={true}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.getByTestId('slash-line-effect')).toBeInTheDocument()
  })

  it('shows no slash-line effect when the answer is incorrect', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={false}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.queryByTestId('slash-line-effect')).not.toBeInTheDocument()
  })

  it('shows no slash-line effect before any answer has been given', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={null}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.queryByTestId('slash-line-effect')).not.toBeInTheDocument()
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/screens/BattleScreen.test.tsx`
Expected: the 3 new tests FAIL (`Unable to find an element by: [data-testid="slash-line-effect"]` for the first; the other two currently pass vacuously since the element doesn't exist yet — check that the first new test is the one that fails, confirming the testid isn't already present).

- [ ] **Step 3: Add the `slash-line` keyframe**

In `src/index.css`, add this new keyframe immediately after the existing `slash` keyframe block (after line 52, before the `shake` keyframe):

```css
@keyframes slash-line {
  0% {
    transform: rotate(-45deg) scaleX(0);
    opacity: 0;
  }
  25% {
    transform: rotate(-45deg) scaleX(1);
    opacity: 1;
  }
  60% {
    transform: rotate(-45deg) scaleX(1);
    opacity: 1;
  }
  100% {
    transform: rotate(-45deg) scaleX(1);
    opacity: 0;
  }
}
```

- [ ] **Step 4: Add the slash-line element in BattleScreen**

In `src/screens/BattleScreen.tsx`, add the new element directly after the existing `slash-effect` span's closing `)}` (after line 64, still inside the `<div className="relative" key={answerSeq}>` block from line 49):

```tsx
        {lastAnswerCorrect === true && (
          <span
            data-testid="slash-line-effect"
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
          >
            <span className="w-[160%] h-[3px] bg-gradient-to-r from-transparent via-white to-transparent animate-[slash-line_0.35s_ease-out_forwards]" />
          </span>
        )}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm vitest run src/screens/BattleScreen.test.tsx`
Expected: PASS (all tests in the file, including the 3 new ones).

- [ ] **Step 6: Run the full test suite**

Run: `pnpm vitest run`
Expected: PASS (no regressions in `App.test.tsx` or elsewhere — the killing-blow linger tests key off `slash-effect`, which is untouched).

- [ ] **Step 7: Visual check**

Run: `pnpm dev`, open the app, answer a question correctly, and confirm the white diagonal line appears alongside the 🗡️ sweep, running from upper-right to lower-left, fading out together with the dagger.

- [ ] **Step 8: Commit**

```bash
git add src/screens/BattleScreen.tsx src/index.css src/screens/BattleScreen.test.tsx
git commit -m "feat: add white slash-line effect alongside the dagger sweep"
```

---

## Self-Review Notes

- **Spec coverage:** display condition (matches `slash-effect`), line shape (straight diagonal streak, `rotate(-45deg)` matching the dagger's translate path), texture (sharp thin line via gradient bar, no glow), timing (`0.35s ease-out forwards`, same as `slash`) — all covered in Task 1. `App.test.tsx` intentionally untouched per spec's "影響しない範囲".
- **Placeholder scan:** none — all steps have literal code.
- **Type consistency:** no new props/types introduced; `data-testid="slash-line-effect"` string is consistent across Steps 1 and 4.
