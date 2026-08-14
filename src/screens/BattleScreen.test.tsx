import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
})
