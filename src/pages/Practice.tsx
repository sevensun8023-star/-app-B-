import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { AnswerSheet } from '../components/AnswerSheet'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { QuestionCard } from '../components/QuestionCard'
import {
  findSectionById,
  getNextPracticeSection,
  chapterCatalog,
} from '../data/catalog'
import { MOCK_EXAM_CONFIG } from '../data/mockExams'
import { questions } from '../data/questions'
import { useProgress } from '../hooks/useProgress'
import { useSwipe } from '../hooks/useSwipe'
import type { Question } from '../types'
import { checkAnswer } from '../utils/question'
import {
  clearMockExamSession,
  loadMockExamSession,
  type MockExamSession,
} from '../utils/mockExam'
import {
  getQuestionsByIds,
  getQuestionsBySection,
} from '../utils/question'
import type { ExamResultState, PracticeResultState } from './Result'
import './Practice.css'

type Mode = 'section' | 'random' | 'mock' | 'wrong'

function toSelected(answer: string | string[]): string[] {
  return Array.isArray(answer) ? answer : [answer]
}

function pickRandomQuestion(excludeIds: Set<string>): Question {
  const pool = questions.filter((q) => !excludeIds.has(q.id))
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)]
  }
  return questions[Math.floor(Math.random() * questions.length)]
}

export function PracticePage() {
  const { mode, id } = useParams<{ mode: Mode; id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const practiceState = location.state as {
    startIndex?: number
    fresh?: boolean
  } | null
  const { progress, submitAnswer, addExamResult } = useProgress()

  const isRandom = mode === 'random'
  const isMock = mode === 'mock'
  const [mockSession] = useState<MockExamSession | null>(() =>
    isMock ? loadMockExamSession() : null,
  )

  const [randomIds, setRandomIds] = useState<string[]>(() =>
    isRandom ? [pickRandomQuestion(new Set()).id] : [],
  )

  const [currentIndex, setCurrentIndex] = useState(
    () => practiceState?.startIndex ?? 0,
  )
  const [selected, setSelected] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  const [sessionAnswers, setSessionAnswers] = useState<
    Record<string, { answer: string[]; correct: boolean }>
  >({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [startedAt] = useState(() => mockSession?.startedAt ?? Date.now())
  const autoNextTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionAnswersRef = useRef(sessionAnswers)
  sessionAnswersRef.current = sessionAnswers

  const section = mode === 'section' ? findSectionById(chapterCatalog, id!) : null
  const showAnswerSheet = mode === 'section' || mode === 'wrong' || isMock

  const sessionQuestions = useMemo((): Question[] => {
    switch (mode) {
      case 'section':
        return getQuestionsBySection(questions, id!)
      case 'random':
        return getQuestionsByIds(questions, randomIds)
      case 'wrong':
        return getQuestionsByIds(questions, progress.wrongBook)
      case 'mock':
        if (!mockSession) return []
        return getQuestionsByIds(questions, mockSession.questionIds)
      default:
        return []
    }
  }, [mode, id, progress.wrongBook, randomIds, mockSession])

  const currentQuestion = sessionQuestions[currentIndex]
  const isLast = currentIndex === sessionQuestions.length - 1
  const isMultiple = currentQuestion?.type === 'multiple'
  const sessionDoneCount = Object.keys(sessionAnswers).length

  const buildResultState = useCallback((): PracticeResultState => {
    const entries = Object.entries(sessionAnswersRef.current)
    const correct = entries.filter(([, v]) => v.correct).length
    const total = entries.length
    const wrong = total - correct
    const wrongQuestions = entries
      .filter(([, v]) => !v.correct)
      .map(([qid]) => questions.find((q) => q.id === qid)!)
      .filter(Boolean)

    const nextSection =
      mode === 'section' && id
        ? getNextPracticeSection(chapterCatalog, id)
        : null

    return {
      mode: mode === 'section' ? 'section' : 'random',
      title:
        mode === 'section'
          ? (section?.title ?? '章节练习')
          : '随机练题',
      total,
      correct,
      wrong,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      wrongQuestions,
      nextSectionId: nextSection?.practiceId,
      nextSectionTitle: nextSection?.title,
    }
  }, [mode, id, section])

  const finishPractice = useCallback(() => {
    const state = buildResultState()
    if (state.total === 0) {
      navigate(mode === 'section' ? '/chapters' : '/')
      return
    }
    navigate('/result/practice', { state })
  }, [buildResultState, navigate, mode])

  const finishExam = useCallback(() => {
    if (!mockSession) return
    const answers = sessionAnswersRef.current
    const total = sessionQuestions.length
    const correct = sessionQuestions.filter((q) => answers[q.id]?.correct).length
    const score = total > 0 ? Math.round((correct / total) * 100) : 0
    const wrongQuestions = sessionQuestions.filter((q) => !answers[q.id]?.correct)
    const wrongQuestionIds = wrongQuestions.map((q) => q.id)
    const duration = Math.round((Date.now() - startedAt) / 1000)

    addExamResult({
      id: `result-${Date.now()}`,
      mockExamId: mockSession.id,
      mockExamTitle: MOCK_EXAM_CONFIG.title,
      score,
      total,
      correct,
      duration,
      passed: score >= MOCK_EXAM_CONFIG.passScore,
      completedAt: Date.now(),
      wrongQuestionIds,
    })

    clearMockExamSession()

    const resultState: ExamResultState = {
      title: MOCK_EXAM_CONFIG.title,
      score,
      total,
      correct,
      duration,
      passed: score >= MOCK_EXAM_CONFIG.passScore,
      passScore: MOCK_EXAM_CONFIG.passScore,
      wrongQuestions,
    }
    navigate('/result/exam', { state: resultState })
  }, [mockSession, sessionQuestions, addExamResult, navigate, startedAt])

  const handleExitRequest = useCallback(() => {
    setExitDialogOpen(true)
  }, [])

  const handleExitConfirm = useCallback(() => {
    setExitDialogOpen(false)
    if (isMock) {
      if (sessionDoneCount > 0) {
        finishExam()
      } else {
        clearMockExamSession()
        navigate('/exams')
      }
      return
    }
    if (sessionDoneCount > 0) {
      finishPractice()
    } else {
      navigate(mode === 'section' ? '/chapters' : '/')
    }
  }, [isMock, sessionDoneCount, finishExam, finishPractice, navigate, mode])

  useEffect(() => {
    if (isMock && !mockSession) {
      navigate('/exams', { replace: true })
    }
  }, [isMock, mockSession, navigate])

  useEffect(() => {
    if (mode === 'section') {
      setCurrentIndex(practiceState?.startIndex ?? 0)
      if (practiceState?.fresh) {
        setSessionAnswers({})
        setSelected([])
        setShowResult(false)
      }
    }
  }, [mode, id, practiceState?.startIndex, practiceState?.fresh])

  useEffect(() => {
    if (mockSession) {
      const elapsed = Math.floor((Date.now() - mockSession.startedAt) / 1000)
      const totalSeconds = mockSession.durationMinutes * 60
      setTimeLeft(Math.max(0, totalSeconds - elapsed))
    }
  }, [mockSession])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((t) => (t !== null && t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft === null ? null : mockSession?.id])

  useEffect(() => {
    if (timeLeft === 0 && mockSession) finishExam()
  }, [timeLeft, mockSession, finishExam])

  useEffect(() => {
    return () => {
      if (autoNextTimer.current) clearTimeout(autoNextTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const listener = App.addListener('backButton', () => {
      handleExitRequest()
    })

    return () => {
      listener.then((l) => l.remove())
    }
  }, [handleExitRequest])

  const loadQuestionState = useCallback(
    (index: number) => {
      const q = sessionQuestions[index]
      if (!q) return
      const session = sessionAnswers[q.id]
      if (session) {
        setSelected(session.answer)
        setShowResult(true)
        return
      }
      if (!isRandom && !isMock) {
        const saved = progress.answered[q.id]
        if (saved) {
          setSelected(toSelected(saved.userAnswer))
          setShowResult(true)
          return
        }
      }
      setSelected([])
      setShowResult(false)
    },
    [sessionQuestions, sessionAnswers, progress.answered, isRandom, isMock],
  )

  useEffect(() => {
    loadQuestionState(currentIndex)
  }, [currentIndex, loadQuestionState])

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= sessionQuestions.length) return
      if (autoNextTimer.current) clearTimeout(autoNextTimer.current)
      setSelected([])
      setShowResult(false)
      setCurrentIndex(index)
      setSheetOpen(false)
    },
    [sessionQuestions.length],
  )

  const goNext = useCallback(() => {
    if (isRandom) {
      if (currentIndex < sessionQuestions.length - 1) {
        goTo(currentIndex + 1)
      } else {
        const used = new Set(randomIds)
        const next = pickRandomQuestion(used)
        setSelected([])
        setShowResult(false)
        setRandomIds((prev) => {
          const updated = [...prev, next.id]
          setCurrentIndex(updated.length - 1)
          return updated
        })
      }
      return
    }

    if (isLast) {
      if (isMock) {
        finishExam()
      } else if (mode === 'section') {
        finishPractice()
      } else {
        finishPractice()
      }
      return
    }
    goTo(currentIndex + 1)
  }, [
    isRandom,
    currentIndex,
    sessionQuestions.length,
    randomIds,
    isLast,
    isMock,
    mode,
    goTo,
    finishExam,
    finishPractice,
  ])

  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo])

  const swipe = useSwipe({
    onSwipeLeft: () => {
      if (isRandom && isLast && !showResult) return
      goNext()
    },
    onSwipeRight: goPrev,
  })

  const submitCurrent = useCallback(
    (letters: string[]) => {
      if (!currentQuestion || letters.length === 0) return
      const userAnswer =
        currentQuestion.type === 'multiple' ? letters : letters[0]
      const isCorrect = checkAnswer(currentQuestion, userAnswer)

      if (!isMock) {
        submitAnswer(
          {
            questionId: currentQuestion.id,
            userAnswer,
            isCorrect,
            answeredAt: Date.now(),
          },
          currentQuestion.sectionId,
        )
      }

      setSessionAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: { answer: letters, correct: isCorrect },
      }))
      setShowResult(true)

      if (!isMock && !isMultiple && isCorrect) {
        autoNextTimer.current = setTimeout(() => {
          setSelected([])
          setShowResult(false)
          goNext()
        }, 600)
      }
    },
    [currentQuestion, submitAnswer, isMock, isMultiple, goNext],
  )

  const handleSelect = useCallback(
    (letters: string[]) => {
      if (!currentQuestion || showResult) return
      setSelected(letters)
      if (currentQuestion.type !== 'multiple') {
        submitCurrent(letters)
      }
    },
    [currentQuestion, showResult, submitCurrent],
  )

  const getTitle = () => {
    switch (mode) {
      case 'section':
        return section?.title ?? '章节练习'
      case 'random':
        return '随机练题'
      case 'wrong':
        return '错题本'
      case 'mock':
        return MOCK_EXAM_CONFIG.title
      default:
        return '练习'
    }
  }

  if (sessionQuestions.length === 0) {
    return (
      <div className="practice-page">
        <header className="practice-header">
          <button type="button" className="practice-back" onClick={handleExitRequest}>
            ←
          </button>
          <h1>{getTitle()}</h1>
        </header>
        <div className="empty-state">
          <p>
            {mode === 'wrong'
              ? '太棒了，暂无错题！'
              : mode === 'section'
                ? '该小节题目尚未导入'
                : '暂无题目'}
          </p>
          <button type="button" onClick={() => navigate(isMock ? '/exams' : '/chapters')}>
            返回
          </button>
        </div>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const isCorrectNow =
    currentQuestion &&
    (sessionAnswers[currentQuestion.id]?.correct ??
      (!isRandom && !isMock && progress.answered[currentQuestion.id]?.isCorrect))

  const progressLabel = isRandom
    ? `已练 ${sessionDoneCount} 题`
    : `${currentIndex + 1} / ${sessionQuestions.length}`

  const exitMessage = isMock
    ? sessionDoneCount > 0
      ? `已答 ${sessionDoneCount} 题，退出将交卷并查看成绩。`
      : '还没有答题，确定要退出考试吗？'
    : sessionDoneCount > 0
      ? `已练 ${sessionDoneCount} 题，退出后可查看本次练习记录。`
      : '还没有答题，确定要退出吗？'

  return (
    <div className="practice-page">
      <header className="practice-header">
        <button type="button" className="practice-back" onClick={handleExitRequest}>
          ←
        </button>
        <h1>{getTitle()}</h1>
        {isRandom ? (
          <button
            type="button"
            className="end-practice-btn"
            onClick={finishPractice}
            disabled={sessionDoneCount === 0}
          >
            结束
          </button>
        ) : showAnswerSheet ? (
          <button
            type="button"
            className="sheet-toggle"
            onClick={() => setSheetOpen(true)}
          >
            答题卡
          </button>
        ) : (
          <span className="header-spacer" />
        )}
      </header>

      {isRandom && (
        <div className="random-status">无限模式 · {progressLabel}</div>
      )}

      {timeLeft !== null && timeLeft > 0 && (
        <div className={`timer ${timeLeft < 300 ? 'urgent' : ''}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      )}

      {!isRandom && (
        <div className="practice-progress">
          <div
            className="practice-progress-fill"
            style={{
              width: `${((currentIndex + 1) / sessionQuestions.length) * 100}%`,
            }}
          />
        </div>
      )}

      <div
        className="practice-swipe-area"
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        {currentQuestion && (
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            index={currentIndex}
            total={isRandom ? sessionDoneCount + 1 : sessionQuestions.length}
            selected={selected}
            showResult={showResult}
            onSelect={handleSelect}
          />
        )}
      </div>

      <div className="practice-nav-hint">
        {isRandom ? '答对自动下一题 · 点击右上角结束练习' : '← 右滑上一题 · 左滑下一题 →'}
      </div>

      <div className="practice-actions">
        {isMultiple && !showResult && (
          <button
            type="button"
            className="btn-primary"
            disabled={selected.length === 0}
            onClick={() => submitCurrent(selected)}
          >
            确认答案
          </button>
        )}
        {showResult && (isMultiple || !isCorrectNow) && (
          <button type="button" className="btn-primary" onClick={goNext}>
            {isLast && !isRandom
              ? isMock
                ? '交卷'
                : mode === 'section'
                  ? '完成练习'
                  : '完成'
              : '下一题'}
          </button>
        )}
        {showResult && !isMultiple && isCorrectNow && !isLast && (
          <p className="auto-hint">答对了，自动跳转下一题...</p>
        )}
        {showResult && !isMultiple && isCorrectNow && isLast && !isMock && !isRandom && (
          <button type="button" className="btn-primary" onClick={goNext}>
            完成练习
          </button>
        )}
        {isRandom && sessionDoneCount > 0 && (
          <button type="button" className="btn-outline" onClick={finishPractice}>
            结束练习
          </button>
        )}
        {isMock && sessionDoneCount > 0 && (
          <button type="button" className="btn-outline" onClick={finishExam}>
            提前交卷
          </button>
        )}
      </div>

      {showAnswerSheet && (
        <AnswerSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          questions={sessionQuestions}
          currentIndex={currentIndex}
          progress={progress}
          sessionAnswers={Object.fromEntries(
            Object.entries(sessionAnswers).map(([k, v]) => [k, { correct: v.correct }]),
          )}
          onJump={goTo}
        />
      )}

      <ConfirmDialog
        open={exitDialogOpen}
        title={isMock ? '退出考试？' : '退出练习？'}
        message={exitMessage}
        cancelLabel="点错了"
        confirmLabel={isMock ? (sessionDoneCount > 0 ? '交卷退出' : '退出') : '退出练习'}
        onCancel={() => setExitDialogOpen(false)}
        onConfirm={handleExitConfirm}
      />
    </div>
  )
}
