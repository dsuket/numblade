import type { Enemy as EnemyModel } from '../game/models'

interface EnemyProps {
  enemy: EnemyModel
  isBoss?: boolean
}

export default function Enemy({ enemy, isBoss }: EnemyProps) {
  return (
    <div className="flex flex-col items-center gap-1" data-testid="enemy">
      <div
        className={isBoss ? 'text-[6rem] drop-shadow-[0_0_12px_#ff4d6d]' : 'text-[4rem]'}
        aria-hidden="true"
      >
        {isBoss ? '🐉' : '👾'}
      </div>
      <div className="text-[#e6f1ff] text-base">{enemy.name}</div>
    </div>
  )
}
