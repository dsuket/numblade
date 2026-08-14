import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TitleScreen from './TitleScreen'

describe('TitleScreen', () => {
  it('shows the title and start button', () => {
    render(<TitleScreen level={1} highScore={0} onStart={() => {}} onResetLevel={() => {}} />)
    expect(screen.getByText('NUMBLADE')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'スタート' })).toBeInTheDocument()
  })

  it('calls onStart when the start button is clicked', () => {
    const onStart = vi.fn()
    render(<TitleScreen level={1} highScore={0} onStart={onStart} onResetLevel={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('does not show the reset-level button at the minimum level', () => {
    render(<TitleScreen level={1} highScore={0} onStart={() => {}} onResetLevel={() => {}} />)
    expect(screen.queryByRole('button', { name: 'レベルをリセット' })).not.toBeInTheDocument()
  })

  it('shows the reset-level button above the minimum level and calls onResetLevel when clicked', () => {
    const onResetLevel = vi.fn()
    render(<TitleScreen level={3} highScore={0} onStart={() => {}} onResetLevel={onResetLevel} />)
    const button = screen.getByRole('button', { name: 'レベルをリセット' })
    fireEvent.click(button)
    expect(onResetLevel).toHaveBeenCalledTimes(1)
  })
})
