import type { Question } from '../types'
import { checkAnswer } from './question'

export type AnswerStatus = 'unanswered' | 'correct' | 'wrong'

export function getAnswerStatus(
  question: Question,
  progress: { answered: Record<string, { isCorrect: boolean }> },
  sessionAnswers?: Record<string, { correct: boolean }>,
): AnswerStatus {
  const session = sessionAnswers?.[question.id]
  if (session) return session.correct ? 'correct' : 'wrong'
  const record = progress.answered[question.id]
  if (!record) return 'unanswered'
  return record.isCorrect ? 'correct' : 'wrong'
}

export function groupQuestionsByType(questions: Question[]) {
  return {
    single: questions.filter((q) => q.type === 'single'),
    multiple: questions.filter((q) => q.type === 'multiple'),
    judge: questions.filter((q) => q.type === 'judge'),
  }
}

export function getExamProgress(
  totalQuestions: number,
  answeredIds: Set<string>,
  examDateStr: string,
) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const examDate = new Date(examDateStr)
  examDate.setHours(0, 0, 0, 0)
  const done = answeredIds.size
  const remaining = Math.max(0, totalQuestions - done)
  const daysLeft = Math.max(
    0,
    Math.ceil((examDate.getTime() - today.getTime()) / 86400000),
  )
  const dailyNeeded = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : remaining
  const percent = totalQuestions > 0 ? Math.round((done / totalQuestions) * 100) : 0

  return { done, remaining, daysLeft, dailyNeeded, percent, examDateStr }
}

export { checkAnswer }
