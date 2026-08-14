# 攻撃時スラッシュエフェクト & ミス時シェイクエフェクト 設計

## 背景・目的

バトル画面では現在、正解/不正解時にテキストフィードバック（「せいかい！」「ざんねん…もういちど！」）のみが表示される。攻撃・被弾の手応えを強めるため、以下を追加する。

- 正解時（＝敵への攻撃が成功した時）: 敵に斬撃エフェクトを表示
- 不正解時（＝ミス時）: 敵が左右にシェイクする

演出は既存の敵撃破時の爆発エフェクト（💥をscale+fadeでオーバーレイ）と同じ路線（絵文字 + CSS keyframeアニメーション）で統一する。

## 対象範囲

- `src/index.css`: 新規keyframe `slash` と `shake` を追加
- `src/screens/BattleScreen.tsx`: `Enemy` コンポーネントを relative コンテナで包み、正解時は斬撃オーバーレイ、不正解時はシェイククラスを条件付きで適用
- `src/screens/BattleScreen.test.tsx`: 新規挙動のテストを追加

`Enemy.tsx` 自体や `DefeatedScreen.tsx`、`reducer.ts` の変更は不要（`lastAnswerCorrect` と `question.id` は既にpropsとして渡っている）。

## 設計詳細

### 攻撃（正解）: 斬撃エフェクト

- `BattleScreen` 内、`<Enemy>` の直後に絵文字 `⚔️` を斜め配置したオーバーレイ `<span>` を追加。
- `lastAnswerCorrect === true` の時だけ描画し、`key={question.id}` を付けて連続正解でも毎回再生されるようにする（feedback-popと同じパターン）。
- 新keyframe `slash`（scale + opacity + わずかな回転で「振り抜いた」印象を出す）を0.35秒程度で再生。
- `data-testid="slash-effect"` を付与し、テストで存在確認できるようにする。

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
```

### ミス（不正解）: シェイク

- `<Enemy>` を包む wrapper 要素に、`lastAnswerCorrect === false` の時だけ `animate-[shake_0.4s_ease-in-out]` クラスを付与。
- `key={question.id}` をwrapperに付けて連続ミスでも再生されるようにする。
- 新keyframe `shake`（translateXを左右に往復させ、最後は0に戻す）。

```css
@keyframes shake {
  0%, 100% {
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

### BattleScreenの構造変更（概略）

```tsx
<div className="relative" key={question.id}>
  <div className={lastAnswerCorrect === false ? 'animate-[shake_0.4s_ease-in-out]' : ''}>
    <Enemy enemy={enemy} isBoss={isBoss} />
  </div>
  {lastAnswerCorrect === true && (
    <span data-testid="slash-effect" aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-6xl animate-[slash_0.35s_ease-out_forwards]">
      ⚔️
    </span>
  )}
</div>
```

`key={question.id}` はwrapper divに置き、shake/slashのどちらも同じkeyでリマウントされるようにする（現状の `lastAnswerCorrect` はANSWER時に必ず新しい `question.id` とセットで更新されるため、これで問題なく再発火する）。

## テスト方針（TDD）

`BattleScreen.test.tsx` に以下を追加:

- `lastAnswerCorrect={true}` の時、`data-testid="slash-effect"` が存在する
- `lastAnswerCorrect={false}` の時、`data-testid="slash-effect"` が存在しない
- `lastAnswerCorrect={null}` の時、`data-testid="slash-effect"` が存在しない（初期表示）
- `lastAnswerCorrect={false}` の時、Enemy wrapperに `shake` を含むクラスが付与されている（`animate-[shake` を含むかで判定）

既存のfeedback関連テストとの整合性は壊さない。

## 影響しない範囲

- `Enemy.tsx`, `DefeatedScreen.tsx`, `ResultScreen.tsx`, `reducer.ts`, `battle.ts` は変更なし
- ボス戦・通常戦どちらも同じロジックで動作する
