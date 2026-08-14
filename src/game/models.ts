export type Operation = 'multiply' | 'divide'

export interface Question {
  id: string
  expression: string
  answer: number
  choices: number[]
}

export interface Enemy {
  id: string
  name: string
  maxHp: number
  hp: number
}
