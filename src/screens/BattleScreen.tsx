import ComboDisplay from '../components/ComboDisplay'
import Enemy from '../components/Enemy'
import HpBar from '../components/HpBar'
import QuestionPanel from '../components/QuestionPanel'
import type { Enemy as EnemyModel, Question } from '../game/models'

interface BattleScreenProps {
  enemy: EnemyModel
  question: Question
  level: number
  combo: number
  score: number
  isBoss: boolean
  lastAnswerCorrect: boolean | null
  battleMessage: string | null
  onAnswer: (value: number) => void
}

export default function BattleScreen({
  enemy,
  question,
  level,
  combo,
  score,
  isBoss,
  lastAnswerCorrect,
  battleMessage,
  onAnswer,
}: BattleScreenProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[480px] p-4">
      <span className="text-[#e6f1ff]/70 text-sm">レベル {level}</span>
      <Enemy enemy={enemy} isBoss={isBoss} />
      <HpBar hp={enemy.hp} maxHp={enemy.maxHp} />
      <div className="flex justify-between w-full text-[#e6f1ff]">
        <ComboDisplay combo={combo} />
        <span>スコア {score}</span>
      </div>
      <div className="min-h-8 flex items-center justify-center text-center" data-testid="answer-feedback">
        {battleMessage && <span className="text-[#ffd166] font-bold text-base">{battleMessage}</span>}
        {!battleMessage && lastAnswerCorrect === true && (
          <span className="text-[#4ade80] font-bold text-lg">せいかい！</span>
        )}
        {!battleMessage && lastAnswerCorrect === false && (
          <span className="text-[#ff4d6d] font-bold text-lg">ざんねん…もういちど！</span>
        )}
      </div>
      <QuestionPanel question={question} onAnswer={onAnswer} />
    </div>
  )
}
