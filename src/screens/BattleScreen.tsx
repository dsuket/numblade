import ComboDisplay from '../components/ComboDisplay'
import Enemy from '../components/Enemy'
import HpBar from '../components/HpBar'
import QuestionPanel from '../components/QuestionPanel'
import type { Enemy as EnemyModel, Question } from '../game/models'
import './BattleScreen.css'

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
    <div className="battle-screen">
      <Enemy enemy={enemy} isBoss={isBoss} />
      <HpBar hp={enemy.hp} maxHp={enemy.maxHp} />
      <div className="battle-hud">
        <ComboDisplay combo={combo} />
        <span className="battle-score">スコア {score}</span>
      </div>
      <QuestionPanel question={question} onAnswer={onAnswer} />
    </div>
  )
}
