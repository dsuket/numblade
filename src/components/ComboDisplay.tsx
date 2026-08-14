import './ComboDisplay.css'

interface ComboDisplayProps {
  combo: number
}

export default function ComboDisplay({ combo }: ComboDisplayProps) {
  const isMilestone = combo === 3 || combo === 5 || combo === 10
  return (
    <div className={`combo-display${isMilestone ? ' combo-display--milestone' : ''}`}>
      コンボ {combo}
    </div>
  )
}
