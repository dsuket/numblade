interface ChoiceButtonProps {
  value: number
  onSelect: (value: number) => void
  disabled?: boolean
}

export default function ChoiceButton({ value, onSelect, disabled }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      className="min-h-16 rounded-xl border-2 border-[#3a86ff] bg-[#101a2e] text-2xl text-[#e6f1ff] cursor-pointer active:bg-[#3a86ff] disabled:opacity-50 disabled:cursor-default"
      onClick={() => onSelect(value)}
      disabled={disabled}
    >
      {value}
    </button>
  )
}
