import ChoiceButton from './ChoiceButton'
import type { Question } from '../game/models'

interface QuestionPanelProps {
  question: Question
  onAnswer: (value: number) => void
  disabled?: boolean
}

export default function QuestionPanel({ question, onAnswer, disabled }: QuestionPanelProps) {
  return (
    <div className="flex flex-col gap-4 items-center w-full">
      <div className="text-[2rem] text-[#e6f1ff]">{question.expression} = ?</div>
      <div className="grid grid-cols-2 gap-8 w-full max-w-xs">
        {question.choices.map((choice) => (
          <ChoiceButton key={choice} value={choice} onSelect={onAnswer} disabled={disabled} />
        ))}
      </div>
    </div>
  )
}
