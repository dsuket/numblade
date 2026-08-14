import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ENEMY_SEQUENCE } from '../game/battle'

// Reads the currently displayed question ("6 x 7 = ?" / "42 ÷ 6 = ?"),
// computes the correct answer, and clicks the matching choice button.
function answerCorrectly() {
  const exprEl = screen.getByText(/=\s*\?/)
  const expr = exprEl.textContent!.replace(/\s*=\s*\?$/, '').trim()
  const [aStr, op, bStr] = expr.split(' ')
  const a = Number(aStr)
  const b = Number(bStr)
  const answer = op === 'x' ? a * b : a / b
  fireEvent.click(screen.getByRole('button', { name: String(answer) }))
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the title screen with a start button', () => {
    render(<App />)
    expect(screen.getByText('NUMBLADE')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'スタート' })).toBeInTheDocument()
  })

  it('starts the battle after clicking the start button', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))
    expect(screen.getByTestId('enemy')).toBeInTheDocument()
    expect(screen.getByText(/=\s*\?/)).toBeInTheDocument()
  })

  it('keeps showing the battle screen with the slash effect right after the killing blow, then switches to the defeated screen once the delay elapses', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    for (let i = 0; i < ENEMY_SEQUENCE[0].questionCount; i++) {
      answerCorrectly()
    }

    // Right after the killing blow: still the battle screen, slash showing.
    expect(screen.getByTestId('slash-effect')).toBeInTheDocument()
    expect(screen.queryByTestId('explosion')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    // After the delay: switched to the defeated screen.
    expect(screen.getByTestId('explosion')).toBeInTheDocument()
    expect(screen.queryByTestId('slash-effect')).not.toBeInTheDocument()
  })

  it('disables the choice buttons while the killing-blow slash effect is lingering', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    for (let i = 0; i < ENEMY_SEQUENCE[0].questionCount; i++) {
      answerCorrectly()
    }

    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
    }
  })
})
