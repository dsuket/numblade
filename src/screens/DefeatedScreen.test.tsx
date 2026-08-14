import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DefeatedScreen from './DefeatedScreen'
import type { Enemy } from '../game/models'

const enemy: Enemy = { id: 'e1', name: 'ゴブリン', maxHp: 60, hp: 0 }

describe('DefeatedScreen', () => {
  it('shows the defeat message and the defeated enemy', () => {
    render(<DefeatedScreen enemy={enemy} message="ゴブリンをたおした！" onContinue={() => {}} />)
    expect(screen.getByText('ゴブリンをたおした！')).toBeInTheDocument()
    expect(screen.getByTestId('enemy')).toBeInTheDocument()
  })

  it('calls onContinue when tapped', () => {
    const onContinue = vi.fn()
    render(<DefeatedScreen enemy={enemy} message="ゴブリンをたおした！" onContinue={onContinue} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})
