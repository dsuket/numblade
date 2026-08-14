import './ChoiceButton.css'

interface ChoiceButtonProps {
  value: number
  onSelect: (value: number) => void
  disabled?: boolean
}

export default function ChoiceButton({ value, onSelect, disabled }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      className="choice-button"
      onClick={() => onSelect(value)}
      disabled={disabled}
    >
      {value}
    </button>
  )
}
