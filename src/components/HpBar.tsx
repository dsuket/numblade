interface HpBarProps {
  hp: number
  maxHp: number
}

export default function HpBar({ hp, maxHp }: HpBarProps) {
  const percent = maxHp === 0 ? 0 : Math.max(0, Math.min(100, (hp / maxHp) * 100))
  return (
    <div
      className="relative w-full h-5 bg-[#1e2a44] rounded-[10px] overflow-hidden"
      role="progressbar"
      aria-valuenow={hp}
      aria-valuemin={0}
      aria-valuemax={maxHp}
    >
      <div
        className="h-full bg-[#ff4d6d] transition-[width] duration-300 ease-[ease]"
        style={{ width: `${percent}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-xs text-[#e6f1ff]">
        {hp} / {maxHp}
      </span>
    </div>
  )
}
