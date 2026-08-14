import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ResultScreen from './ResultScreen'

describe('ResultScreen', () => {
  it('shows a game-clear banner along with the run stats', () => {
    render(
      <ResultScreen
        correctAnswered={10}
        questionsAnswered={12}
        maxCombo={10}
        score={1450}
        highScore={1450}
        onRestart={() => {}}
      />,
    )
    expect(screen.getByText('ゲームクリア！')).toBeInTheDocument()
    expect(screen.getByText('正答数: 10 / 12')).toBeInTheDocument()
    expect(screen.getByText('正答率: 83%')).toBeInTheDocument()
    expect(screen.getByTestId('explosion')).toBeInTheDocument()
  })

  it('calls onRestart when the restart button is clicked', () => {
    const onRestart = vi.fn()
    render(
      <ResultScreen
        correctAnswered={10}
        questionsAnswered={10}
        maxCombo={10}
        score={1450}
        highScore={1450}
        onRestart={onRestart}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'もう一度' }))
    expect(onRestart).toHaveBeenCalledTimes(1)
  })
})
