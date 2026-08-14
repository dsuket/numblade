import { applyDamage, createEnemy, damagePerCorrectAnswer, ENEMY_SEQUENCE, isDefeated } from './battle'
import { getLevelParams, nextLevel, type DifficultyLevel } from './difficulty'
import type { Enemy, Question } from './models'
import { generateQuestion } from './questionGenerator'
import { nextCombo, scoreForAnswer } from './scoring'
import { loadProgress, saveProgress } from '../storage/gameStorage'

export type Screen = 'title' | 'battle' | 'result'

export interface GameState {
  screen: Screen
  level: DifficultyLevel
  highScore: number
  score: number
  combo: number
  maxCombo: number
  segmentIndex: number
  enemy: Enemy | null
  question: Question | null
  questionsAnswered: number
  correctAnswered: number
  recentResults: boolean[]
  lastAnswerCorrect: boolean | null
}

export type GameAction = { type: 'START' } | { type: 'ANSWER'; value: number } | { type: 'RESTART' }

function questionForLevel(level: DifficultyLevel): Question {
  const params = getLevelParams(level)
  return generateQuestion(params.digitsA, params.digitsB, params.operation)
}

function segmentQuestionsBefore(segmentIndex: number): number {
  return ENEMY_SEQUENCE.slice(0, segmentIndex).reduce((sum, s) => sum + s.questionCount, 0)
}

export function initGameState(): GameState {
  const stored = loadProgress()
  return {
    screen: 'title',
    level: stored?.level ?? 1,
    highScore: stored?.highScore ?? 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    segmentIndex: 0,
    enemy: null,
    question: null,
    questionsAnswered: 0,
    correctAnswered: 0,
    recentResults: [],
    lastAnswerCorrect: null,
  }
}

function startBattle(state: GameState): GameState {
  const segment = ENEMY_SEQUENCE[0]
  return {
    ...state,
    screen: 'battle',
    score: 0,
    combo: 0,
    maxCombo: 0,
    segmentIndex: 0,
    enemy: createEnemy(segment),
    question: questionForLevel(state.level),
    questionsAnswered: 0,
    correctAnswered: 0,
    recentResults: [],
    lastAnswerCorrect: null,
  }
}

function answer(state: GameState, value: number): GameState {
  if (state.screen !== 'battle' || !state.enemy || !state.question) return state

  const segment = ENEMY_SEQUENCE[state.segmentIndex]
  const correct = value === state.question.answer
  const combo = nextCombo(state.combo, correct)
  const maxCombo = Math.max(state.maxCombo, combo)
  const score = state.score + (correct ? scoreForAnswer(combo) : 0)
  const enemy = correct ? applyDamage(state.enemy, damagePerCorrectAnswer(segment)) : state.enemy
  const questionsAnswered = state.questionsAnswered + 1
  const correctAnswered = state.correctAnswered + (correct ? 1 : 0)
  const recentResults = [...state.recentResults, correct].slice(-3)
  const level = nextLevel(state.level, recentResults)

  const segmentQuestionsUsed = questionsAnswered - segmentQuestionsBefore(state.segmentIndex)
  const segmentDone = segmentQuestionsUsed >= segment.questionCount || isDefeated(enemy)
  const isLastSegment = state.segmentIndex === ENEMY_SEQUENCE.length - 1

  const base: GameState = {
    ...state,
    level,
    score,
    combo,
    maxCombo,
    enemy,
    questionsAnswered,
    correctAnswered,
    recentResults,
    lastAnswerCorrect: correct,
  }

  if (segmentDone && isLastSegment) {
    const highScore = Math.max(state.highScore, score)
    saveProgress({ level, highScore })
    return { ...base, screen: 'result', highScore, question: null }
  }

  if (segmentDone) {
    const nextSegmentIndex = state.segmentIndex + 1
    return {
      ...base,
      segmentIndex: nextSegmentIndex,
      enemy: createEnemy(ENEMY_SEQUENCE[nextSegmentIndex]),
      question: questionForLevel(level),
    }
  }

  return { ...base, question: questionForLevel(level) }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      return startBattle(state)
    case 'ANSWER':
      return answer(state, action.value)
    case 'RESTART':
      return startBattle(state)
    default:
      return state
  }
}
