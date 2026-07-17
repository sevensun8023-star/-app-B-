import type { AnswerRecord, ExamResult, SectionNode, UserProgress } from '../types'
import type { Question } from '../types'

const STORAGE_KEY = 'practice-app-progress'

const defaultProgress = (): UserProgress => ({
  answered: {},
  wrongBook: [],
  examResults: [],
  sectionStats: {},
})

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress()
    const parsed = JSON.parse(raw)
    return {
      ...defaultProgress(),
      ...parsed,
      sectionStats: parsed.sectionStats ?? parsed.chapterStats ?? {},
    }
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(progress: UserProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function recordAnswer(
  progress: UserProgress,
  record: AnswerRecord,
  sectionId: string,
): UserProgress {
  const next = { ...progress }
  next.answered = { ...next.answered, [record.questionId]: record }

  if (!record.isCorrect && !next.wrongBook.includes(record.questionId)) {
    next.wrongBook = [...next.wrongBook, record.questionId]
  }
  if (record.isCorrect) {
    next.wrongBook = next.wrongBook.filter((id) => id !== record.questionId)
  }

  const stats = next.sectionStats[sectionId] ?? { done: 0, correct: 0 }
  const prev = progress.answered[record.questionId]
  next.sectionStats = {
    ...next.sectionStats,
    [sectionId]: {
      done: prev ? stats.done : stats.done + 1,
      correct: prev
        ? stats.correct + (record.isCorrect ? 1 : 0) - (prev.isCorrect ? 1 : 0)
        : stats.correct + (record.isCorrect ? 1 : 0),
    },
  }

  return next
}

export function saveExamResult(
  progress: UserProgress,
  result: ExamResult,
): UserProgress {
  return {
    ...progress,
    examResults: [result, ...progress.examResults].slice(0, 50),
  }
}

export function getOverallStats(progress: UserProgress) {
  const answered = Object.values(progress.answered)
  const total = answered.length
  const correct = answered.filter((a) => a.isCorrect).length
  return {
    total,
    correct,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    wrongCount: progress.wrongBook.length,
  }
}

export function getSectionStats(
  progress: UserProgress,
  sectionIds: string[],
) {
  let done = 0
  let correct = 0
  for (const id of sectionIds) {
    const stats = progress.sectionStats[id]
    if (stats) {
      done += stats.done
      correct += stats.correct
    }
  }
  return {
    done,
    correct,
    accuracy: done > 0 ? Math.round((correct / done) * 100) : 0,
  }
}

export function collectSectionIds(node: SectionNode): string[] {
  const ids: string[] = []
  if (node.practiceId) ids.push(node.practiceId)
  if (node.children) {
    for (const child of node.children) {
      ids.push(...collectSectionIds(child))
    }
  }
  return ids
}

export function hasSectionProgress(
  progress: UserProgress,
  sectionQuestions: Question[],
): boolean {
  return sectionQuestions.some((q) => progress.answered[q.id])
}

export function getSectionResumeIndex(
  progress: UserProgress,
  sectionQuestions: Question[],
): number {
  const idx = sectionQuestions.findIndex((q) => !progress.answered[q.id])
  return idx === -1 ? 0 : idx
}

export function getSectionDoneCount(
  progress: UserProgress,
  sectionQuestions: Question[],
): number {
  return sectionQuestions.filter((q) => progress.answered[q.id]).length
}

export function clearSectionProgress(
  progress: UserProgress,
  sectionId: string,
  sectionQuestions: Question[],
): UserProgress {
  const idSet = new Set(sectionQuestions.map((q) => q.id))
  const answered = { ...progress.answered }
  for (const qid of idSet) {
    delete answered[qid]
  }
  const wrongBook = progress.wrongBook.filter((id) => !idSet.has(id))
  const sectionStats = {
    ...progress.sectionStats,
    [sectionId]: { done: 0, correct: 0 },
  }
  return { ...progress, answered, wrongBook, sectionStats }
}

/** Mark all questions in a section as done (for restoring progress after reinstall). */
export function markSectionComplete(
  progress: UserProgress,
  sectionId: string,
  sectionQuestions: Question[],
): UserProgress {
  let next = { ...progress, answered: { ...progress.answered } }
  const now = Date.now()
  for (const q of sectionQuestions) {
    if (next.answered[q.id]) continue
    next.answered[q.id] = {
      questionId: q.id,
      userAnswer: q.answer,
      isCorrect: true,
      answeredAt: now,
    }
  }
  next.sectionStats = {
    ...next.sectionStats,
    [sectionId]: {
      done: sectionQuestions.length,
      correct: sectionQuestions.filter((q) => next.answered[q.id]?.isCorrect).length,
    },
  }
  return next
}
