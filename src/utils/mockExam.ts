import type { Question } from '../types'
import { shuffle } from './question'

export const MOCK_EXAM_CONFIG = {
  title: '模拟考试',
  description: '从全部 2697 道题中随机抽取 100 道，限时 60 分钟',
  questionCount: 100,
  duration: 60,
  passScore: 60,
} as const

export interface MockExamSession {
  id: string
  questionIds: string[]
  startedAt: number
  durationMinutes: number
}

const SESSION_KEY = 'practice-app-mock-session'

export function createMockExamSession(allQuestions: Question[]): MockExamSession {
  const count = Math.min(MOCK_EXAM_CONFIG.questionCount, allQuestions.length)
  const questionIds = shuffle([...allQuestions])
    .slice(0, count)
    .map((q) => q.id)

  return {
    id: `exam-${Date.now()}`,
    questionIds,
    startedAt: Date.now(),
    durationMinutes: MOCK_EXAM_CONFIG.duration,
  }
}

export function saveMockExamSession(session: MockExamSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function loadMockExamSession(): MockExamSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as MockExamSession
  } catch {
    return null
  }
}

export function clearMockExamSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}
