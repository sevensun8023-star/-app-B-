import allQuestions from './questions/all.json'
import type { Question } from '../types'

export const questions: Question[] = allQuestions as Question[]

export function getQuestionsBySection(sectionId: string): Question[] {
  return questions.filter((q) => q.sectionId === sectionId)
}

export function getTotalQuestionCount(): number {
  return questions.length
}

export function getSectionQuestionCount(sectionId: string): number {
  return getQuestionsBySection(sectionId).length
}
