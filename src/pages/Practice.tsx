import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AnswerSheet } from '../components/AnswerSheet'
import { QuestionCard } from '../components/QuestionCard'
import {
  findSectionById,
  getNextPracticeSection,
  chapterCatalog,
} from '../data/catalog'
import { mockExams } from '../data/mockExams'
import { questions } from '../data/questions'
import { useProgress } from '../hooks/useProgress'
import { useSwipe } from '../hooks/useSwipe'
import type { Question } from '../types'
import { checkAnswer } from '../utils/question'
import {
  getQuestionsByIds,
  getQuestionsBySection,
  shuffle,
} from '../utils/question'
import type { PracticeResultState } from './Result'
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
  const [randomIds, setRandomIds] = useState<string[]>(() =>
    isRandom ? [pickRandomQuestion(new Set()).id] : [],
  )

  const [currentIndex, setCurrentIndex] = useState(
    () => practiceState?.startIndex ?? 0,
  )
  const [selected, setSelected] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sessionAnswers, setSessionAnswers] = useState<
    Record<string, { answer: string[]; correct: boolean }>
  >({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [startedAt] = useState(Date.now())
  const autoNextTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionAnswersRef = useRef(sessionAnswers)
  sessionAnswersRef.current = sessionAnswers

  const section = mode === 'section' ? findSectionById(chapterCatalog, id!) : null
  const showAnswerSheet = mode === 'section' || mode === 'wrong'

  const sessionQuestions = useMemo((): Question[] => {
    switch (mode) {
      case 'section':
        return getQuestionsBySection(questions, id!)
      case 'random':
        return getQuestionsByIds(questions, randomIds)
      case 'wrong':
        return getQuestionsByIds(questions, progress.wrongBook)
      case 'mock': {
        const exam = mockExams.find((e) => e.id === id)
        return exam ? shuffle(getQuestionsByIds(questions, exam.questionIds)) : []
      }
      default:
        return []
    }
  }, [mode, id, progress.wrongBook, randomIds])

  const mockExam = mode === 'mock' ? mockExams.find((e) => e.id === id) : null
  const currentQuestion = sessionQuestions[currentIndex]
  const isLast = currentIndex === sessionQuestions.length - 1
  const isMock = mode === 'mock'
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
    if (!mockExam) return
    const answers = sessionAnswersRef.current
    const total = sessionQuestions.length
    const correct = sessionQuestions.filter((q) => answers[q.id]?.correct).length
    const score = total > 0 ? Math.round((correct / total) * 100) : 0
    addExamResult({
      id: `result-${Date.now()}`,
      mockExamId: mockExam.id,
      mockExamTitle: mockExam.title,
      score,
      total,
      correct,
      duration: Math.round((Date.now() - startedAt) / 1000),
      passed: score >= mockExam.passScore,
      completedAt: Date.now(),
    })
    navigate(`/result/${mockExam.id}?score=${score}&correct=${correct}&total=${total}`)
  }, [mockExam, sessionQuestions, addExamResult, navigate, startedAt])

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
    if (mockExam) setTimeLeft(mockExam.duration * 60)
  }, [mockExam])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((t) => (t !== null && t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft === null ? null : mockExam?.id])

  useEffect(() => {
    if (timeLeft === 0 && mockExam) finishExam()
  }, [timeLeft, mockExam, finishExam])

  useEffect(() => {
    return () => {
      if (autoNextTimer.current) clearTimeout(autoNextTimer.current)
    }
  }, [])

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
      if (!isRandom) {
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
    [sessionQuestions, sessionAnswers, progress.answered, isRandom],
  )

  useEffect(() => {
    loadQuestionState(currentIndex)
  }, [currentIndex, loadQuestionState])

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= sessionQuestions.length) return
      if (autoNextTimer.current) clearTimeout(autoNextTimer.current)
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

      submitAnswer(
        {
          questionId: currentQuestion.id,
          userAnswer,
          isCorrect,
          answeredAt: Date.now(),
        },
        currentQuestion.sectionId,
      )

      setSessionAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: { answer: letters, correct: isCorrect },
      }))
      setShowResult(true)

      if (!isMock && !isMultiple && isCorrect) {
        autoNextTimer.current = setTimeout(() => goNext(), 600)
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
        return mockExam?.title ?? '模拟考试'
      default:
        return '练习'
    }
  }

  const getBackTo = () => {
    switch (mode) {
      case 'section':
        return '/chapters'
      case 'mock':
        return '/exams'
      default:
        return '/'
    }
  }

  if (sessionQuestions.length === 0) {
    return (
      <div className="practice-page">
        <header className="practice-header">
          <Link to={getBackTo()} className="practice-back">←</Link>
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
          <button type="button" onClick={() => navigate(getBackTo())}>
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
      (!isRandom && progress.answered[currentQuestion.id]?.isCorrect))

  const progressLabel = isRandom
    ? `已练 ${sessionDoneCount} 题`
    : `${currentIndex + 1} / ${sessionQuestions.length}`

  return (
    <div className="practice-page">
      <header className="practice-header">
        <Link to={getBackTo()} className="practice-back">←</Link>
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
    </div>
  )
}
