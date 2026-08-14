import ChoiceButton from './ChoiceButton'
import type { Question } from '../game/models'
import './QuestionPanel.css'

interface QuestionPanelProps {
  question: Question
  onAnswer: (value: number) => void
  disabled?: boolean
}

export default function QuestionPanel({ question, onAnswer, disabled }: QuestionPanelProps) {
  return (
    <div className="question-panel">
      <div className="question-expression">{question.expression} = ?</div>
      <div className="question-choices">
        {question.choices.map((choice) => (
          <ChoiceButton key={choice} value={choice} onSelect={onAnswer} disabled={disabled} />
        ))}
      </div>
    </div>
  )
}
