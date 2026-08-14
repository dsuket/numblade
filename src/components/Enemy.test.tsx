import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Enemy from './Enemy'
import type { Enemy as EnemyModel } from '../game/models'

function makeEnemy(name: string): EnemyModel {
  return { id: 'e1', name, maxHp: 60, hp: 60 }
}

describe('Enemy', () => {
  it('renders a pixel-art sprite (svg) instead of an emoji', () => {
    render(<Enemy enemy={makeEnemy('ゴブリン')} />)
    expect(screen.getByTestId('enemy').querySelector('svg')).toBeInTheDocument()
  })

  it('shows the enemy name', () => {
    render(<Enemy enemy={makeEnemy('オーガ')} />)
    expect(screen.getByText('オーガ')).toBeInTheDocument()
  })

  it('falls back to the default sprite for an unrecognized enemy name', () => {
    render(<Enemy enemy={makeEnemy('謎の敵')} />)
    expect(screen.getByTestId('enemy').querySelector('svg')).toBeInTheDocument()
  })

  it('renders the sprite larger for a boss', () => {
    const { container: normalContainer } = render(<Enemy enemy={makeEnemy('ゴブリン')} isBoss={false} />)
    const { container: bossContainer } = render(<Enemy enemy={makeEnemy('ドラゴン')} isBoss={true} />)
    const normalSize = Number(normalContainer.querySelector('svg')?.getAttribute('width'))
    const bossSize = Number(bossContainer.querySelector('svg')?.getAttribute('width'))
    expect(bossSize).toBeGreaterThan(normalSize)
  })
})
