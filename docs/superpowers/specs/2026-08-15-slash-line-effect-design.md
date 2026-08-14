# 斬撃エフェクトへの白い斬撃線追加 設計

## 背景・目的

現在、正解時の斬撃演出は🗡️絵文字が右上から左下へスイープするだけ（`src/index.css` の `slash` keyframe、`src/screens/BattleScreen.tsx` の `slash-effect`）。これに、剣で切りつけた瞬間らしさを強めるため、白い斜めの斬撃線エフェクトを追加する。

## 対象範囲

- `src/screens/BattleScreen.tsx`: `slash-effect`（🗡️）の隣に、白い斬撃線用の要素を追加
- `src/index.css`: 新しいkeyframe `slash-line` を追加
- `src/screens/BattleScreen.test.tsx`: 既存の `slash-effect` テスト（表示/非表示/未回答時）と対になるテストケースを追加

`src/game/reducer.ts`, `src/app/App.tsx`, `src/components/Enemy.tsx` は変更しない。既存の🗡️の表示条件・タイミング・撃破時の余韻表示（linger）ロジックはそのまま利用する。

## 設計詳細

### 表示条件・配置

🗡️と同じ `<div className="relative" key={answerSeq}>` の内側、`lastAnswerCorrect === true` のときのみ表示する（🗡️の`span`と同じ条件・同じ親要素なので、表示/非表示・撃破時のlinger中の継続表示・`answerSeq`変化での再マウントは自動的に🗡️と揃う）。

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

- 外側の `span`: `absolute inset-0` で敵の表示エリア全体を覆い、`overflow-hidden` でバーが敵の表示エリア外にはみ出さないようクリップする。`flex items-center justify-center` で内側のバーを中央に配置する。
- 内側の `span`（バー本体）: 高さ3pxの細いバー。`bg-gradient-to-r from-transparent via-white to-transparent` で両端が透明・中央が白のグラデーションにし、線の端がくっきり切れずに自然にフェードする見た目にする。

### アニメーション（`src/index.css`）

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

- `rotate(-45deg)`: 🗡️の斬撃軌道（`translate(55%, -55%)` → `translate(-55%, 55%)`、右上→左下）と同じ対角線上にバーを向ける。
- `scaleX(0)` → `scaleX(1)`: バーの中心を起点に一瞬で左右へ伸びる。伸び切ったところで少し保持してからフェードアウトする。
- `0.35s ease-out forwards`: 🗡️の `slash` アニメーションと同じ長さ・イージングにし、🗡️と同時に発火・完了させる。

## テスト方針（TDD）

`src/screens/BattleScreen.test.tsx` に、既存の `slash-effect` に対する3テストと対になる形で追加する（テストを先に書いてから実装する）:

- 正解時（`lastAnswerCorrect={true}`）: `slash-line-effect` が表示される
- 不正解時（`lastAnswerCorrect={false}`）: `slash-line-effect` が表示されない
- 未回答時（`lastAnswerCorrect={null}`）: `slash-line-effect` が表示されない

`src/app/App.test.tsx` の撃破時linger関連テストは `slash-effect` を既存のproxyとして使っているため変更不要（🗡️と白線は同じ条件・同じ親要素で連動するため、🗡️のテストが通れば白線side effectも同様に振る舞う）。

## 影響しない範囲

- 🗡️（`slash-effect`）の見た目・アニメーション・表示条件は変更なし
- `src/game/reducer.ts`, `src/app/App.tsx`, `src/components/Enemy.tsx` は変更なし
- 撃破時のlingerロジック（`App.tsx`）は変更なし
