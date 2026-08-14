import './HpBar.css'

interface HpBarProps {
  hp: number
  maxHp: number
}

export default function HpBar({ hp, maxHp }: HpBarProps) {
  const percent = maxHp === 0 ? 0 : Math.max(0, Math.min(100, (hp / maxHp) * 100))
  return (
    <div className="hp-bar" role="progressbar" aria-valuenow={hp} aria-valuemin={0} aria-valuemax={maxHp}>
      <div className="hp-bar-fill" style={{ width: `${percent}%` }} />
      <span className="hp-bar-label">{hp} / {maxHp}</span>
    </div>
  )
}
