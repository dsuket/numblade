interface ComboDisplayProps {
  combo: number
}

export default function ComboDisplay({ combo }: ComboDisplayProps) {
  const isMilestone = combo === 3 || combo === 5 || combo === 10
  return (
    <div
      className={`text-xl font-bold ${isMilestone ? 'text-[#ff4d6d] [text-shadow:0_0_8px_#ff4d6d]' : 'text-[#ffd166]'}`}
    >
      コンボ {combo}
    </div>
  )
}
