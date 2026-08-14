import { useState } from 'react'
import HpBar from '../components/HpBar'
import QuestionPanel from '../components/QuestionPanel'
import { applyDamage, isDefeated } from '../game/battle'
import type { Enemy } from '../game/models'
import { generateQuestion } from '../game/questionGenerator'
import { nextCombo, scoreForAnswer } from '../game/scoring'
import './App.css'

const DAMAGE_PER_CORRECT_ANSWER = 25

function makeEnemy(): Enemy {
  return { id: 'prototype-enemy', name: 'Slime', maxHp: 100, hp: 100 }
}

export default function App() {
  const [enemy, setEnemy] = useState<Enemy>(makeEnemy)
  const [question, setQuestion] = useState(() => generateQuestion(1, 1))
  const [combo, setCombo] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)

  const defeated = isDefeated(enemy)

  function handleAnswer(value: number) {
    if (defeated) return
    const correct = value === question.answer
    setFeedback(correct ? 'correct' : 'incorrect')
    setCombo((prev) => nextCombo(prev, correct))

    if (correct) {
      setScore((prev) => prev + scoreForAnswer(combo))
      setEnemy((prev) => applyDamage(prev, DAMAGE_PER_CORRECT_ANSWER))
    }

    setQuestion(generateQuestion(1, 1))
  }

  return (
    <div className="app">
      <h1>NUMBLADE</h1>
      {defeated ? (
        <p data-testid="victory-message">敵を倒した！ Score: {score}</p>
      ) : (
        <>
          <HpBar hp={enemy.hp} maxHp={enemy.maxHp} />
          <p>Combo: {combo} / Score: {score}</p>
          {feedback && <p data-testid="feedback">{feedback === 'correct' ? '正解！' : '不正解'}</p>}
          <QuestionPanel question={question} onAnswer={handleAnswer} />
        </>
      )}
    </div>
  )
}
