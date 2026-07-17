import type { Question, MockExam } from '../../types'
import all from './all.json'
import papersJson from './papers.json'

export const paperQuestions = all as Question[]

const categoryOrder: Record<string, number> = {
  模拟: 1,
  预测: 2,
  冲刺: 3,
  点题: 4,
}

function paperSortKey(title: string) {
  const map: Record<string, number> = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
  }
  for (const [k, v] of Object.entries(map)) {
    if (title.includes(k)) return v
  }
  return 99
}

export const papers = [...(papersJson as MockExam[])].sort((a, b) => {
  const ca = categoryOrder[a.category ?? ''] ?? 99
  const cb = categoryOrder[b.category ?? ''] ?? 99
  if (ca !== cb) return ca - cb
  return paperSortKey(a.title) - paperSortKey(b.title)
})

export function getPaperById(id: string) {
  return papers.find((p) => p.id === id)
}

export function getPaperQuestions(paperId: string): Question[] {
  const paper = getPaperById(paperId)
  if (!paper) return []
  const map = new Map(paperQuestions.map((q) => [q.id, q]))
  return paper.questionIds.map((id) => map.get(id)).filter((q): q is Question => !!q)
}

export const PAPER_CATEGORIES = ['模拟', '预测', '冲刺', '点题'] as const
