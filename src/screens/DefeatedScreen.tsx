import Enemy from '../components/Enemy'
import type { Enemy as EnemyModel } from '../game/models'

interface DefeatedScreenProps {
  enemy: EnemyModel
  message: string
  onContinue: () => void
}

export default function DefeatedScreen({ enemy, message, onContinue }: DefeatedScreenProps) {
  return (
    <button
      type="button"
      onClick={onContinue}
      className="flex flex-col items-center gap-6 w-full max-w-[480px] min-h-16 p-4"
    >
      <div className="relative flex items-center justify-center">
        <div className="opacity-40 grayscale">
          <Enemy enemy={enemy} isBoss={false} />
        </div>
        <span className="absolute inset-0 flex items-center justify-center text-center text-[#ffd166] font-bold text-2xl px-2">
          {message}
        </span>
      </div>
      <span className="text-[#e6f1ff] text-sm animate-pulse">タップしてつづける ▶</span>
    </button>
  )
}
