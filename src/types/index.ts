export type QuestionType = 'single' | 'multiple' | 'judge'

export interface Question {
  id: string
  sectionId: string
  type: QuestionType
  question: string
  options: string[]
  answer: string | string[]
  explanation?: string
}

export interface SectionNode {
  id: string
  title: string
  expectedTotal?: number
  children?: SectionNode[]
  practiceId?: string
}

export interface MockExam {
  id: string
  title: string
  description?: string
  questionIds: string[]
  duration: number
  passScore: number
}

export type PracticeMode = 'section' | 'random' | 'mock' | 'wrong'

export interface AnswerRecord {
  questionId: string
  userAnswer: string | string[]
  isCorrect: boolean
  answeredAt: number
}

export interface ExamResult {
  id: string
  mockExamId: string
  mockExamTitle: string
  score: number
  total: number
  correct: number
  duration: number
  passed: boolean
  completedAt: number
}

export interface UserProgress {
  answered: Record<string, AnswerRecord>
  wrongBook: string[]
  examResults: ExamResult[]
  sectionStats: Record<string, { done: number; correct: number }>
}
