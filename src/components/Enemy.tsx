import type { Enemy as EnemyModel } from '../game/models'
import './Enemy.css'

interface EnemyProps {
  enemy: EnemyModel
  isBoss?: boolean
}

export default function Enemy({ enemy, isBoss }: EnemyProps) {
  return (
    <div className={`enemy${isBoss ? ' enemy--boss' : ''}`} data-testid="enemy">
      <div className="enemy-sprite" aria-hidden="true">
        {isBoss ? '🐉' : '👾'}
      </div>
      <div className="enemy-name">{enemy.name}</div>
    </div>
  )
}
