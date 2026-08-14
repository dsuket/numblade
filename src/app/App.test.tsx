import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

function computeAnswer(expression: string): number {
  const multiply = expression.match(/^(\d+) x (\d+)$/)
  if (multiply) return Number(multiply[1]) * Number(multiply[2])
  const divide = expression.match(/^(\d+) ÷ (\d+)$/)
  if (divide) return Number(divide[1]) / Number(divide[2])
  throw new Error(`unrecognized expression: ${expression}`)
}

function clickWrongAnswer() {
  const expressionText = screen.getByText(/=\s*\?/).textContent ?? ''
  const answer = computeAnswer(expressionText.replace(/\s*=\s*\?$/, '').trim())
  const wrongButton = screen.getAllByRole('button').find((button) => button.textContent !== String(answer))
  if (!wrongButton) throw new Error('no wrong-answer choice available')
  fireEvent.click(wrongButton)
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
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

  it('shows the game-over screen after enough wrong answers to run out of hp', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    for (let i = 0; i < 4; i++) {
      clickWrongAnswer()
    }

    expect(screen.getByText('ゲームオーバー')).toBeInTheDocument()
  })
})
