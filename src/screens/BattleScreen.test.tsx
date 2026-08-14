import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BattleScreen from './BattleScreen'
import type { Enemy, Question } from '../game/models'

const enemy: Enemy = { id: 'e1', name: 'ゴブリン', maxHp: 60, hp: 60 }
const question: Question = { id: 'q1', expression: '2 x 3', answer: 6, choices: [6, 7, 8, 9] }

describe('BattleScreen', () => {
  it('shows no feedback before any answer has been given', () => {
    render(
      <BattleScreen
        enemy={enemy}
        question={question}
        combo={0}
        score={0}
        isBoss={false}
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
        combo={1}
        score={100}
        isBoss={false}
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
        combo={0}
        score={0}
        isBoss={false}
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
        combo={0}
        score={0}
        isBoss={false}
        lastAnswerCorrect={true}
        battleMessage="ゴブリンをたおした！ オーガがあらわれた！"
        onAnswer={() => {}}
      />,
    )
    expect(screen.getByText('ゴブリンをたおした！ オーガがあらわれた！')).toBeInTheDocument()
    expect(screen.queryByText('せいかい！')).not.toBeInTheDocument()
  })
})
