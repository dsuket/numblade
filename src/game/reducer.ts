import { applyDamage, createEnemy, damagePerCorrectAnswer, ENEMY_SEQUENCE, isDefeated } from './battle'
import { getLevelParams, MIN_LEVEL, nextLevel, type DifficultyLevel } from './difficulty'
import type { Enemy, Question } from './models'
import { applyMiss, isGameOver, PLAYER_MAX_HP } from './player'
import { generateQuestion } from './questionGenerator'
import { bonusTierForElapsed, multiplierForTier, nextCombo, scoreForAnswer, type BonusTier } from './scoring'
import { loadProgress, saveProgress } from '../storage/gameStorage'

export type Screen = 'title' | 'battle' | 'defeated' | 'result' | 'gameover'

export interface GameState {
  screen: Screen
  level: DifficultyLevel
  highScore: number
  score: number
  combo: number
  maxCombo: number
  segmentIndex: number
  enemy: Enemy | null
  playerHp: number
  question: Question | null
  questionsAnswered: number
  correctAnswered: number
  recentResults: boolean[]
  lastAnswerCorrect: boolean | null
  battleMessage: string | null
  bonusTier: BonusTier
}

export type GameAction =
  | { type: 'START' }
  | { type: 'ANSWER'; value: number; elapsedMs: number }
  | { type: 'TIMEOUT' }
  | { type: 'CONTINUE' }
  | { type: 'RESTART' }
  | { type: 'RESET_LEVEL' }
  | { type: 'QUIT_TO_TITLE' }

function questionForLevel(level: DifficultyLevel): Question {
  const params = getLevelParams(level)
  return generateQuestion(params.digitsA, params.digitsB, params.operation)
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
    playerHp: PLAYER_MAX_HP,
    question: null,
    questionsAnswered: 0,
    correctAnswered: 0,
    recentResults: [],
    lastAnswerCorrect: null,
    battleMessage: null,
    bonusTier: null,
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
    playerHp: PLAYER_MAX_HP,
    question: questionForLevel(state.level),
    questionsAnswered: 0,
    correctAnswered: 0,
    recentResults: [],
    lastAnswerCorrect: null,
    battleMessage: `${segment.name}があらわれた！`,
    bonusTier: null,
  }
}

// Shared by a wrong ANSWER and an unanswered TIMEOUT — both are a miss with
// identical consequences: combo resets, playerHp drops by 1, and the battle
// either ends (gameover) or serves the next question. Never deals enemy
// damage and never awards a speed bonus.
function applyMissResult(state: GameState): GameState {
  const combo = nextCombo(state.combo, false)
  const playerHp = applyMiss(state.playerHp)
  const questionsAnswered = state.questionsAnswered + 1
  const pendingRecentResults = [...state.recentResults, false].slice(-3)
  const level = nextLevel(state.level, pendingRecentResults)
  // Reset the streak window once it has fired a level change, so a long
  // unbroken streak steps the level once per 3-correct/2-wrong window
  // instead of re-triggering on every subsequent answer.
  const recentResults = level === state.level ? pendingRecentResults : []

  const base: GameState = {
    ...state,
    level,
    combo,
    playerHp,
    questionsAnswered,
    recentResults,
    lastAnswerCorrect: false,
    battleMessage: null,
    bonusTier: null,
  }

  if (isGameOver(playerHp)) {
    return { ...base, screen: 'gameover', question: null }
  }

  return { ...base, question: questionForLevel(level) }
}

function answer(state: GameState, value: number, elapsedMs: number): GameState {
  if (state.screen !== 'battle' || !state.enemy || !state.question) return state

  const correct = value === state.question.answer
  if (!correct) return applyMissResult(state)

  const segment = ENEMY_SEQUENCE[state.segmentIndex]
  const bonusTier = bonusTierForElapsed(elapsedMs)
  const multiplier = multiplierForTier(bonusTier)
  const combo = nextCombo(state.combo, true)
  const maxCombo = Math.max(state.maxCombo, combo)
  const score = state.score + scoreForAnswer(combo, multiplier, state.level)
  const enemy = applyDamage(state.enemy, damagePerCorrectAnswer(segment, multiplier))
  const questionsAnswered = state.questionsAnswered + 1
  const correctAnswered = state.correctAnswered + 1
  const pendingRecentResults = [...state.recentResults, true].slice(-3)
  const level = nextLevel(state.level, pendingRecentResults)
  // Reset the streak window once it has fired a level change, so a long
  // unbroken streak steps the level once per 3-correct/2-wrong window
  // instead of re-triggering on every subsequent answer.
  const recentResults = level === state.level ? pendingRecentResults : []

  // Only a defeated enemy ends the segment.
  const segmentDone = isDefeated(enemy)
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
    lastAnswerCorrect: true,
    battleMessage: null,
    bonusTier,
  }

  if (segmentDone && isLastSegment) {
    const highScore = Math.max(state.highScore, score)
    saveProgress({ level, highScore })
    return { ...base, screen: 'result', highScore, question: null }
  }

  if (segmentDone) {
    // Pause on a "defeated" interstitial instead of jumping straight to the
    // next enemy, so the player sees the defeat before continuing.
    return {
      ...base,
      screen: 'defeated',
      question: null,
      battleMessage: `${segment.name}をたおした！`,
    }
  }

  return { ...base, question: questionForLevel(level) }
}

function timeout(state: GameState): GameState {
  if (state.screen !== 'battle' || !state.enemy || !state.question) return state
  return applyMissResult(state)
}

function continueAfterDefeat(state: GameState): GameState {
  if (state.screen !== 'defeated') return state

  const nextSegmentIndex = state.segmentIndex + 1
  const nextSegment = ENEMY_SEQUENCE[nextSegmentIndex]
  return {
    ...state,
    screen: 'battle',
    segmentIndex: nextSegmentIndex,
    enemy: createEnemy(nextSegment),
    question: questionForLevel(state.level),
    lastAnswerCorrect: null,
    battleMessage: `${nextSegment.name}があらわれた！`,
    bonusTier: null,
  }
}

function resetLevel(state: GameState): GameState {
  if (state.screen !== 'title') return state
  const level = MIN_LEVEL
  saveProgress({ level, highScore: state.highScore })
  return { ...state, level }
}

// Discards the in-progress run and returns to title with the last persisted
// level/highScore, since no progress was saved mid-battle (only on segment
// completion via the 'result' screen).
function quitToTitle(state: GameState): GameState {
  if (state.screen !== 'battle' && state.screen !== 'gameover') return state
  return initGameState()
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      return startBattle(state)
    case 'ANSWER':
      return answer(state, action.value, action.elapsedMs)
    case 'TIMEOUT':
      return timeout(state)
    case 'CONTINUE':
      return continueAfterDefeat(state)
    case 'RESTART':
      return startBattle(state)
    case 'RESET_LEVEL':
      return resetLevel(state)
    case 'QUIT_TO_TITLE':
      return quitToTitle(state)
    default:
      return state
  }
}
