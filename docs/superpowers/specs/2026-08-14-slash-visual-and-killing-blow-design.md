# 斬撃エフェクトの見た目変更 & 撃破時の遷行タイミング調整 設計

## 背景・目的

先行実装（`docs/superpowers/specs/2026-08-14-attack-miss-effects-design.md`）で、正解時に敵へ斬撃エフェクト（⚔️）、不正解時にシェイクエフェクトを追加した。これに対して2点の改善を行う。

1. 斬撃エフェクトが「その場で拡大+回転するだけ」で、斬撃らしい方向性がない。絵文字を🗡️に変え、右上から左下へ実際にスイープする動きにする。
2. 敵を倒した止めの一撃では、`reducer.ts` が即座に `screen` を `'defeated'`/`'result'` に切り替えて `question` を `null` にするため、`BattleScreen` が即座にアンマウントされ、斬撃エフェクトが表示される間もなく消えてしまう。止めの一撃でもエフェクトが一瞬見えてから次の画面に遷行するようにする。

## 対象範囲

- `src/index.css`: `slash` keyframeの差し替え
- `src/screens/BattleScreen.tsx`: 絵文字を🗡️に変更
- `src/app/App.tsx`: 撃破直後も0.5秒だけ `BattleScreen` を表示し続けてから `Defeated`/`Result` 画面に切り替えるロジックを追加
- `src/app/App.test.tsx`: 上記の新規テストケース追加（vitestのfake timerを使用）

`src/game/reducer.ts`, `src/game/reducer.test.ts`, `Enemy.tsx`, `DefeatedScreen.tsx`, `ResultScreen.tsx`, `battle.ts` は変更しない（既存のreducerとそのテストへの影響ゼロで実現する）。

## 設計詳細

### 1. 斬撃エフェクトの見た目変更

`src/screens/BattleScreen.tsx` の斬撃オーバーレイの絵文字を `⚔️` → `🗡️` に変更する。

`src/index.css` の `slash` keyframe を、右上から左下へスイープする動きに差し替える。絵文字自体を `-45deg` 回転させることで、刃が斬撃の進行方向（右上→左下）に沿って見えるようにする。

```css
@keyframes slash {
  0% {
    transform: translate(55%, -55%) rotate(-45deg) scale(0.7);
    opacity: 0;
  }
  30% {
    transform: translate(0, 0) rotate(-45deg) scale(1.15);
    opacity: 1;
  }
  100% {
    transform: translate(-55%, 55%) rotate(-45deg) scale(1);
    opacity: 0;
  }
}
```

アニメーションの長さ・イージング（`0.35s ease-out forwards`）、`data-testid="slash-effect"`、表示条件（`lastAnswerCorrect === true`）は変更しない。

### 2. 撃破時の遷行タイミング調整

**現状の問題:** `reducer.ts` の `answer()` は、止めの一撃で `segmentDone` になると即座に `screen: 'defeated'`（または `'result'`）を返し、`question: null` にする。`App.tsx` はこれを見て即座に `BattleScreen` を `DefeatedScreen`/`ResultScreen` に差し替えるため、斬撃エフェクトが描画される間もなく消える。

**方針（UI層のみで遅延させる）:** `reducer.ts` は一切変更しない。撃破時、`state.enemy` は（hp=0のまま）残り、`state.question` だけが `null` になるという既存の挙動をそのまま利用し、`App.tsx` 側で「直前の `question`」を覚えておいて、画面が `'defeated'`/`'result'` に切り替わった直後も0.5秒だけ `BattleScreen` を表示し続ける。

`src/app/App.tsx` の変更:

- `lastQuestionRef`（`useRef<Question | null>`）: `state.question` が非nullの間、常に最新値を保持する。
- `prevScreenRef`（`useRef<Screen>`）: 直前レンダー時点の `state.screen` を保持する（更新は `useEffect` で、コミット後に行う）。
- `justDefeated`（レンダー毎に計算する変数、stateではない）: `(state.screen === 'defeated' || state.screen === 'result') && prevScreenRef.current === 'battle'`。画面がbattleから切り替わった**その最初のレンダー**でのみ `true` になる（`prevScreenRef` はまだ更新前のため）。これにより「一瞬DefeatedScreenが出てから戻る」ようなちらつきを避ける。
- `lingerActive`（`useState<boolean>`、初期値`false`）: `justDefeated` が `true` になったレンダーを検知する `useEffect` で `true` にセットし、0.5秒後の `setTimeout` で `false` に戻す（クリーンアップで解除）。
- 表示条件: `state.screen === 'battle' || justDefeated || lingerActive` が真の間は `BattleScreen` を表示する。使用する `question` は `state.question ?? lastQuestionRef.current`。`isBoss` は既存通り `ENEMY_SEQUENCE[state.segmentIndex].isBoss`（`segmentIndex` は `CONTINUE` 時にしか進まないため、遅延表示中も直前に倒した敵の値のまま正しい）。
- `onAnswer` を `disabled={state.screen !== 'battle'}` として `BattleScreen` に渡す（新規props。`BattleScreen` → `QuestionPanel` → `ChoiceButton` に素通しするだけで、`disabled` は両コンポーネントに既に実装済み・未使用だったものを使う）。遅延表示中の誤タップ・二重ダメージを防ぐ。
- `state.screen === 'defeated'` / `'result'` の分岐は、`justDefeated || lingerActive` が偽になった後にのみ到達するようにする（= 上記のBattleScreen分岐が先に処理されるので、これらの分岐は変更不要）。

### データフロー（撃破時）

```
ANSWER（止めの一撃）
  → reducer: 既存通りscreen='defeated'/'result'、enemy.hp=0、question=null
  → App.tsx: このレンダーではjustDefeated=trueなのでBattleScreenを継続表示（question=lastQuestionRef、disabled=true）
  → useEffect: lingerActive=trueにし、0.5秒後にfalseへ戻すタイマーを開始
  → 0.5秒後: lingerActive=false → BattleScreenの表示条件が偽になり、DefeatedScreen/ResultScreenへ切り替え
```

## テスト方針（TDD）

`src/app/App.test.tsx` に追加（fake timerを使用）:

- 敵を倒す最後の1問に正解した直後（タイマー進行前）: まだ `BattleScreen`（`data-testid="enemy"` かつ `data-testid="slash-effect"`）が表示されており、`DefeatedScreen`（`data-testid="explosion"` を含む撃破後画面）にはまだ切り替わっていない
- 0.5秒分タイマーを進めた後: `DefeatedScreen` に切り替わっている
- 遅延表示中は選択肢ボタンが `disabled` になっている（クリックしても状態が変化しない）

正解を判定するため、表示中の式（例: `"6 x 7 = ?"`）をテスト側で `expression op ? "= ?"` の形式からパースし、乗算・除算に応じて正解値を計算してクリックするテスト用ヘルパーを用意する（`src/game/questionGenerator.ts` の出力形式 `"A x B"` / `"A ÷ B"` に対応する）。

`src/game/reducer.ts` と `src/game/reducer.test.ts` は変更しない。

## 影響しない範囲

- `Enemy.tsx`, `DefeatedScreen.tsx`, `ResultScreen.tsx`, `battle.ts` は変更なし
- 斬撃エフェクトの表示条件・testid・アニメーション長は変更なし（見た目のみ変更）
- 不正解時のシェイクエフェクトは変更なし
