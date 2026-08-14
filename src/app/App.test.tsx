import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ENEMY_SEQUENCE } from '../game/battle'
import { PLAYER_MAX_HP } from '../game/player'
import { saveProgress } from '../storage/gameStorage'

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

function computeAnswer(expression: string): number {
  const multiply = expression.match(/^(\d+) x (\d+)$/)
  if (multiply) return Number(multiply[1]) * Number(multiply[2])
  const divide = expression.match(/^(\d+) ÷ (\d+)$/)
  if (divide) return Number(divide[1]) / Number(divide[2])
  throw new Error(`unrecognized expression: ${expression}`)
}

// Keeps every answer outside the 5s/10s speed-bonus window (>10000ms) and
// well short of the 20s auto-timeout (<20000ms), so tests that assert exact
// hit counts aren't perturbed by the speed bonus's extra damage.
const SLOW_ANSWER_MS = 11000

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

  it('resets the level from the title screen and the button disappears once the level is back to the minimum', () => {
    saveProgress({ level: 4, highScore: 0 })
    render(<App />)

    const resetButton = screen.getByRole('button', { name: 'レベルをリセット' })
    fireEvent.click(resetButton)

    expect(screen.queryByRole('button', { name: 'レベルをリセット' })).not.toBeInTheDocument()
  })

  it('keeps showing the battle screen with the slash effect right after the killing blow, then switches to the defeated screen once the delay elapses', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    for (let i = 0; i < ENEMY_SEQUENCE[0].questionCount; i++) {
      act(() => {
        vi.advanceTimersByTime(SLOW_ANSWER_MS)
      })
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

  it('does not run the turn timeout while sitting on the defeated interstitial', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    for (let i = 0; i < ENEMY_SEQUENCE[0].questionCount; i++) {
      act(() => {
        vi.advanceTimersByTime(SLOW_ANSWER_MS)
      })
      answerCorrectly()
    }

    // Let the killing-blow linger elapse so the app actually switches from
    // the battle screen to the (non-'battle') 'defeated' interstitial.
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.getByTestId('explosion')).toBeInTheDocument()

    // Sit on the defeated interstitial well past the 20s turn timeout. If a
    // timeout were still armed here, it would dispatch TIMEOUT and damage
    // the player even though there is no active question to have missed.
    act(() => {
      vi.advanceTimersByTime(20000)
    })

    fireEvent.click(screen.getByText('タップしてつづける ▶'))

    expect(
      within(screen.getByTestId('player-hp-bar')).getByText(`${PLAYER_MAX_HP} / ${PLAYER_MAX_HP}`),
    ).toBeInTheDocument()
  })

  it('remounts the slash effect on the killing blow so its animation replays even though the previous answer was also correct', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    // Answer everything except the last question correctly — the slash
    // effect element exists from the previous correct answer, and must NOT
    // be the same DOM node once the killing blow lands. Answer slowly so
    // every answer gets a 1x speed-bonus multiplier; otherwise the fake
    // clock stays frozen at 0ms elapsed, every answer would score a
    // "critical" 1.5x damage bonus, and the enemy would die one hit earlier
    // than this test's questionCount-based math expects.
    for (let i = 0; i < ENEMY_SEQUENCE[0].questionCount - 1; i++) {
      act(() => {
        vi.advanceTimersByTime(SLOW_ANSWER_MS)
      })
      answerCorrectly()
    }
    const slashBeforeKill = screen.getByTestId('slash-effect')

    act(() => {
      vi.advanceTimersByTime(SLOW_ANSWER_MS)
    })
    answerCorrectly()

    const slashAfterKill = screen.getByTestId('slash-effect')
    expect(slashAfterKill).not.toBe(slashBeforeKill)
  })

  it('disables the choice buttons while the killing-blow slash effect is lingering', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    for (let i = 0; i < ENEMY_SEQUENCE[0].questionCount; i++) {
      act(() => {
        vi.advanceTimersByTime(SLOW_ANSWER_MS)
      })
      answerCorrectly()
    }

    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
    }
  })

  it('counts up the turn timer while waiting for an answer', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    expect(screen.getByTestId('turn-timer')).toHaveTextContent('0')

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByTestId('turn-timer')).toHaveTextContent('3')
  })

  it('resets the turn timer when a new question appears', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByTestId('turn-timer')).toHaveTextContent('3')

    answerCorrectly()

    expect(screen.getByTestId('turn-timer')).toHaveTextContent('0')
  })

  it('automatically misses and damages the player after 20 seconds with no answer', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    act(() => {
      vi.advanceTimersByTime(20000)
    })

    expect(
      within(screen.getByTestId('player-hp-bar')).getByText(`${PLAYER_MAX_HP - 1} / ${PLAYER_MAX_HP}`),
    ).toBeInTheDocument()
  })

  it('shows a Critical! bonus effect when answered within 5 seconds', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    answerCorrectly()

    expect(screen.getByTestId('bonus-effect')).toHaveTextContent('Critical!')
  })

  it('shows a Nice! bonus effect when answered between 5 and 10 seconds', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    act(() => {
      vi.advanceTimersByTime(7000)
    })
    answerCorrectly()

    expect(screen.getByTestId('bonus-effect')).toHaveTextContent('Nice!')
  })

  it('shows no bonus effect when answered after 10 seconds', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'スタート' }))

    act(() => {
      vi.advanceTimersByTime(12000)
    })
    answerCorrectly()

    expect(screen.queryByTestId('bonus-effect')).not.toBeInTheDocument()
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
