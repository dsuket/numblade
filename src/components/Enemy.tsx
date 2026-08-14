import { DEFAULT_ENEMY_SPRITE, ENEMY_SPRITES } from '../game/enemySprites'
import type { Enemy as EnemyModel } from '../game/models'

interface EnemyProps {
  enemy: EnemyModel
  isBoss?: boolean
}

export default function Enemy({ enemy, isBoss }: EnemyProps) {
  const Sprite = ENEMY_SPRITES[enemy.name] ?? DEFAULT_ENEMY_SPRITE

  return (
    <div className="flex flex-col items-center gap-1" data-testid="enemy">
      <Sprite size={isBoss ? 144 : 96} className={isBoss ? 'drop-shadow-[0_0_12px_#ff4d6d]' : undefined} />
      <div className="text-[#e6f1ff] text-base">{enemy.name}</div>
    </div>
  )
}
