import type { Question } from '../types'

export function getOptionLetter(option: string): string {
  return option.charAt(0)
}

export function normalizeAnswer(answer: string | string[]): string[] {
  return Array.isArray(answer) ? [...answer].sort() : [answer]
}

export function checkAnswer(
  question: Question,
  userAnswer: string | string[],
): boolean {
  const correct = normalizeAnswer(question.answer)
  const user = normalizeAnswer(userAnswer)
  if (correct.length !== user.length) return false
  return correct.every((a, i) => a === user[i])
}

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function getRandomQuestions(
  allQuestions: Question[],
  count: number,
  excludeIds: string[] = [],
): Question[] {
  const pool = allQuestions.filter((q) => !excludeIds.includes(q.id))
  return shuffle(pool).slice(0, Math.min(count, pool.length))
}

export function getQuestionsBySection(
  allQuestions: Question[],
  sectionId: string,
): Question[] {
  return allQuestions.filter((q) => q.sectionId === sectionId)
}

export function getQuestionsByIds(
  allQuestions: Question[],
  ids: string[],
): Question[] {
  const map = new Map(allQuestions.map((q) => [q.id, q]))
  return ids.map((id) => map.get(id)).filter((q): q is Question => !!q)
}

export function getTypeLabel(type: Question['type']): string {
  switch (type) {
    case 'single':
      return '单选题'
    case 'multiple':
      return '多选题'
    case 'judge':
      return '判断题'
  }
}
