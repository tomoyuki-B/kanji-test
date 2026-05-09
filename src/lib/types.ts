export interface QuizAnswer {
  questionId: string
  kanji: string
  reading: string
  userAnswer: string
  isCorrect: boolean
  example: string
  meaning: string
}

export interface ResultNavState {
  answers: QuizAnswer[]
  mode: 'writing' | 'reading'
  grade: 1 | 2 | 3 | 4 | 5 | 6
  questionCount: number
  startedAt: number
  quizState: {
    grade: 1 | 2 | 3 | 4 | 5 | 6
    range: { type: 'random' | 'unit' | 'weak'; unit?: string }
    questionCount: 5 | 10 | 20
  }
}
