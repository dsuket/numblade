import ComboDisplay from '../components/ComboDisplay'
import Enemy from '../components/Enemy'
import HpBar from '../components/HpBar'
import QuestionPanel from '../components/QuestionPanel'
import type { Enemy as EnemyModel, Question } from '../game/models'
import type { BonusTier } from '../game/scoring'

interface BattleScreenProps {
  enemy: EnemyModel
  question: Question
  answerSeq: number
  level: number
  combo: number
  score: number
  isBoss: boolean
  playerHp: number
  playerMaxHp: number
  lastAnswerCorrect: boolean | null
  battleMessage: string | null
  onAnswer: (value: number) => void
  onQuitToTitle?: () => void
  disabled?: boolean
  elapsedSeconds?: number
  bonusTier?: BonusTier
}

export default function BattleScreen({
  enemy,
  question,
  answerSeq,
  level,
  combo,
  score,
  isBoss,
  playerHp,
  playerMaxHp,
  lastAnswerCorrect,
  battleMessage,
  onAnswer,
  onQuitToTitle = () => {},
  disabled,
  elapsedSeconds = 0,
  bonusTier = null,
}: BattleScreenProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[480px] p-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full text-[#e6f1ff]/70 text-sm">
        <span>レベル {level}</span>
        <button
          type="button"
          className="justify-self-center text-[#3a86ff] underline bg-transparent border-none cursor-pointer p-0 disabled:opacity-50 disabled:cursor-default"
          onClick={onQuitToTitle}
          disabled={disabled}
        >
          タイトルに戻る
        </button>
        <span data-testid="turn-timer" className="justify-self-end">
          ⏱ {elapsedSeconds}秒
        </span>
      </div>
      <div className="relative" key={answerSeq}>
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
            🗡️
          </span>
        )}
        {lastAnswerCorrect === true && (
          <span
            data-testid="slash-line-effect"
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
          >
            <span className="shrink-0 w-[160%] h-[3px] bg-gradient-to-r from-transparent via-white to-transparent animate-[slash-line_0.35s_ease-out_forwards]" />
          </span>
        )}
      </div>
      <HpBar hp={enemy.hp} maxHp={enemy.maxHp} />
      <div className="flex justify-between w-full text-[#e6f1ff]">
        <ComboDisplay combo={combo} />
        <span>スコア {score}</span>
      </div>
      <div className="min-h-8 flex items-center justify-center text-center" data-testid="answer-feedback">
        {battleMessage && <span className="text-[#ffd166] font-bold text-base">{battleMessage}</span>}
        {!battleMessage && lastAnswerCorrect === true && (
          // Keyed by the answer sequence number so the animation restarts on
          // every answer, even when the same result (e.g. two wrong answers
          // in a row) would otherwise render identical text. question.id
          // can't be used here: it's null/stale during the killing-blow
          // linger (see App.tsx), so it wouldn't change on that answer.
          <span
            key={answerSeq}
            className="text-[#4ade80] font-bold text-lg animate-[feedback-pop_2.5s_ease-out_forwards]"
          >
            せいかい！
          </span>
        )}
        {!battleMessage && lastAnswerCorrect === true && bonusTier && (
          <span
            key={`bonus-${answerSeq}`}
            data-testid="bonus-effect"
            className="ml-2 text-[#ffd166] font-bold text-lg animate-[feedback-pop_2.5s_ease-out_forwards]"
          >
            {bonusTier === 'critical' ? 'Critical!' : 'Nice!'}
          </span>
        )}
        {!battleMessage && lastAnswerCorrect === false && (
          <span
            key={answerSeq}
            className="text-[#ff4d6d] font-bold text-lg animate-[feedback-pop_2.5s_ease-out_forwards]"
          >
            ざんねん…もういちど！
          </span>
        )}
      </div>
      <QuestionPanel question={question} onAnswer={onAnswer} disabled={disabled} />
      <div className="w-full" data-testid="player-hp-bar">
        <span className="text-[#e6f1ff]/70 text-xs">HP</span>
        <HpBar hp={playerHp} maxHp={playerMaxHp} barColor="bg-[#4ade80]" />
      </div>
    </div>
  )
}
