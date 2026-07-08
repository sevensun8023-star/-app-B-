import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { AnswerRecord, ExamResult, UserProgress } from '../types'
import {
  clearSectionProgress as clearSectionProgressStorage,
  getOverallStats,
  loadProgress,
  recordAnswer,
  saveExamResult,
  saveProgress,
} from '../utils/storage'
import type { Question } from '../types'

interface ProgressContextValue {
  progress: UserProgress
  stats: ReturnType<typeof getOverallStats>
  submitAnswer: (record: AnswerRecord, sectionId: string) => void
  addExamResult: (result: ExamResult) => void
  resetProgress: () => void
  clearSectionProgress: (sectionId: string, sectionQuestions: Question[]) => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(loadProgress)

  const persist = useCallback((next: UserProgress) => {
    setProgress(next)
    saveProgress(next)
  }, [])

  const submitAnswer = useCallback(
    (record: AnswerRecord, sectionId: string) => {
      persist(recordAnswer(progress, record, sectionId))
    },
    [persist, progress],
  )

  const addExamResult = useCallback(
    (result: ExamResult) => {
      persist(saveExamResult(progress, result))
    },
    [persist, progress],
  )

  const resetProgress = useCallback(() => {
    persist({
      answered: {},
      wrongBook: [],
      examResults: [],
      sectionStats: {},
    })
  }, [persist])

  const clearSectionProgress = useCallback(
    (sectionId: string, sectionQuestions: Question[]) => {
      persist(clearSectionProgressStorage(progress, sectionId, sectionQuestions))
    },
    [persist, progress],
  )

  const stats = useMemo(() => getOverallStats(progress), [progress])

  const value = useMemo(
    () => ({
      progress,
      stats,
      submitAnswer,
      addExamResult,
      resetProgress,
      clearSectionProgress,
    }),
    [progress, stats, submitAnswer, addExamResult, resetProgress, clearSectionProgress],
  )

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
