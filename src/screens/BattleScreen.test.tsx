import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import BattleScreen from './BattleScreen'
import type { Enemy, Question } from '../game/models'

const enemy: Enemy = { id: 'e1', name: 'ゴブリン', maxHp: 60, hp: 60 }
const question: Question = { id: 'q1', expression: '2 x 3', answer: 6, choices: [6, 7, 8, 9] }

describe('BattleScreen', () => {
  it('shows the current level', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={3}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={null}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.getByText('レベル 3')).toBeInTheDocument()
  })

  it('shows the player hp', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={3}
        playerMaxHp={4}
        lastAnswerCorrect={null}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(within(screen.getByTestId('player-hp-bar')).getByText('3 / 4')).toBeInTheDocument()
  })

  it('shows no feedback before any answer has been given', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={null}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.queryByText('せいかい！')).not.toBeInTheDocument()
    expect(screen.queryByText('ざんねん…もういちど！')).not.toBeInTheDocument()
  })

  it('shows correct-answer feedback', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={1}
        score={100}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={true}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.getByText('せいかい！')).toBeInTheDocument()
  })

  it('shows incorrect-answer feedback', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={3}
        playerMaxHp={4}
        lastAnswerCorrect={false}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.getByText('ざんねん…もういちど！')).toBeInTheDocument()
  })

  it('shows the battle message instead of answer feedback when both are present', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={true}
        battleMessage="ゴブリンをたおした！ オーガがあらわれた！"
        onAnswer={() => {}}
      />,
    )
    expect(screen.getByText('ゴブリンをたおした！ オーガがあらわれた！')).toBeInTheDocument()
    expect(screen.queryByText('せいかい！')).not.toBeInTheDocument()
  })

  it('shows a slash effect overlay when the answer is correct', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={1}
        score={100}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={true}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.getByTestId('slash-effect')).toBeInTheDocument()
  })

  it('shows no slash effect when the answer is incorrect', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={false}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.queryByTestId('slash-effect')).not.toBeInTheDocument()
  })

  it('shows no slash effect before any answer has been given', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={null}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.queryByTestId('slash-effect')).not.toBeInTheDocument()
  })

  it('shows a slash-line effect overlay when the answer is correct', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={1}
        score={100}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={true}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.getByTestId('slash-line-effect')).toBeInTheDocument()
  })

  it('shows no slash-line effect when the answer is incorrect', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={false}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.queryByTestId('slash-line-effect')).not.toBeInTheDocument()
  })

  it('shows no slash-line effect before any answer has been given', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={null}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.queryByTestId('slash-line-effect')).not.toBeInTheDocument()
  })

  it('shakes the enemy when the answer is incorrect', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={false}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.getByTestId('enemy-shake-wrapper')).toHaveClass('animate-[shake_0.4s_ease-in-out]')
  })

  it('does not shake the enemy when the answer is correct', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={1}
        score={100}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={true}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.getByTestId('enemy-shake-wrapper')).not.toHaveClass('animate-[shake_0.4s_ease-in-out]')
  })

  it('does not shake the enemy before any answer has been given', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={null}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.getByTestId('enemy-shake-wrapper')).not.toHaveClass('animate-[shake_0.4s_ease-in-out]')
  })

  it('shows the elapsed turn timer', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={null}
        battleMessage={null}
        onAnswer={() => {}}
        elapsedSeconds={7}
      />,
    )
    expect(screen.getByTestId('turn-timer')).toHaveTextContent('7')
  })

  it('defaults the turn timer to 0 seconds when not provided', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={null}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.getByTestId('turn-timer')).toHaveTextContent('0')
  })

  it('shows a Critical! bonus effect on a critical-tier correct answer', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={1}
        score={150}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={true}
        battleMessage={null}
        onAnswer={() => {}}
        bonusTier="critical"
      />,
    )
    expect(screen.getByTestId('bonus-effect')).toHaveTextContent('Critical!')
  })

  it('shows a Nice! bonus effect on a nice-tier correct answer', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={1}
        score={120}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={true}
        battleMessage={null}
        onAnswer={() => {}}
        bonusTier="nice"
      />,
    )
    expect(screen.getByTestId('bonus-effect')).toHaveTextContent('Nice!')
  })

  it('shows no bonus effect on a correct answer with no bonus tier', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={1}
        score={100}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={true}
        battleMessage={null}
        onAnswer={() => {}}
      />,
    )
    expect(screen.queryByTestId('bonus-effect')).not.toBeInTheDocument()
  })

  it('shows no bonus effect on an incorrect answer even if a bonus tier is set', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={false}
        battleMessage={null}
        onAnswer={() => {}}
        bonusTier="critical"
      />,
    )
    expect(screen.queryByTestId('bonus-effect')).not.toBeInTheDocument()
  })

  it('calls onQuitToTitle when the quit-to-title link is clicked', () => {
    const onQuitToTitle = vi.fn()
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        answerSeq={1}
        level={1}
        combo={0}
        score={0}
        isBoss={false}
        playerHp={4}
        playerMaxHp={4}
        lastAnswerCorrect={null}
        battleMessage={null}
        onAnswer={() => {}}
        onQuitToTitle={onQuitToTitle}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'タイトルに戻る' }))
    expect(onQuitToTitle).toHaveBeenCalledTimes(1)
  })
})
