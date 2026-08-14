import ComboDisplay from '../components/ComboDisplay'
import Enemy from '../components/Enemy'
import HpBar from '../components/HpBar'
import QuestionPanel from '../components/QuestionPanel'
import type { Enemy as EnemyModel, Question } from '../game/models'

interface BattleScreenProps {
  enemy: EnemyModel
  question: Question
  combo: number
  score: number
  isBoss: boolean
  onAnswer: (value: number) => void
}

export default function BattleScreen({
  enemy,
  question,
  combo,
  score,
  isBoss,
  onAnswer,
}: BattleScreenProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[480px] p-4">
      <Enemy enemy={enemy} isBoss={isBoss} />
      <HpBar hp={enemy.hp} maxHp={enemy.maxHp} />
      <div className="flex justify-between w-full text-[#e6f1ff]">
        <ComboDisplay combo={combo} />
        <span>スコア {score}</span>
      </div>
      <QuestionPanel question={question} onAnswer={onAnswer} />
    </div>
  )
}
