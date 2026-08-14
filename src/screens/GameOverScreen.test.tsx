import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameOverScreen from './GameOverScreen'

describe('GameOverScreen', () => {
  it('shows a game-over banner along with the run stats', () => {
    render(
      <GameOverScreen
        correctAnswered={5}
        questionsAnswered={9}
        maxCombo={4}
        score={320}
        highScore={1450}
        onRestart={() => {}}
      />,
    )
    expect(screen.getByText('ゲームオーバー')).toBeInTheDocument()
    expect(screen.getByText('正答数: 5 / 9')).toBeInTheDocument()
    expect(screen.getByText('正答率: 56%')).toBeInTheDocument()
    expect(screen.getByText('ハイスコア: 1450')).toBeInTheDocument()
  })

  it('calls onRestart when the restart button is clicked', () => {
    const onRestart = vi.fn()
    render(
      <GameOverScreen
        correctAnswered={5}
        questionsAnswered={9}
        maxCombo={4}
        score={320}
        highScore={1450}
        onRestart={onRestart}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'もう一度' }))
    expect(onRestart).toHaveBeenCalledTimes(1)
  })
})
