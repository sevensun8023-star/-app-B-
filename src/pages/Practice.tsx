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
import { getPaperById, getPaperQuestions } from '../data/papers'
import { questions } from '../data/questions'
import { useProgress } from '../hooks/useProgress'
import { useSwipe } from '../hooks/useSwipe'
import type { Question } from '../types'
import { checkAnswer, getQuestionsByIds, getQuestionsBySection } from '../utils/question'
import {
  clearMockExamSession,
  loadMockExamSession,
  type MockExamSession,
} from '../utils/mockExam'
import type { ExamResultState, PracticeResultState } from './Result'
import './Practice.css'

type Mode = 'section' | 'random' | 'mock' | 'wrong' | 'paper' | 'unanswered'

function toSelected(answer: string | string[]): string[] {
  return Array.isArray(answer) ? answer : [answer]
}

function pickFromPool(pool: Question[], excludeIds: Set<string>): Question | null {
  const available = pool.filter((q) => !excludeIds.has(q.id))
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
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
  const isUnanswered = mode === 'unanswered'
  const isMock = mode === 'mock'
  const isPaper = mode === 'paper'
  const isTimedExam = isMock || isPaper

  const paper = isPaper && id ? getPaperById(id) : null

  const [mockSession] = useState<MockExamSession | null>(() =>
    isMock ? loadMockExamSession() : null,
  )

  const unansweredPool = useMemo(() => {
    if (!isUnanswered) return []
    return questions.filter((q) => !progress.answered[q.id])
  }, [isUnanswered, progress.answered])

  const [chainIds, setChainIds] = useState<string[]>(() => {
    if (isRandom) {
      const q = pickFromPool(questions, new Set())
      return q ? [q.id] : []
    }
    if (isUnanswered) {
      const pool = questions.filter((q) => !progress.answered[q.id])
      const q = pickFromPool(pool, new Set())
      return q ? [q.id] : []
    }
    return []
  })

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
  const showAnswerSheet =
    mode === 'section' || mode === 'wrong' || isTimedExam

  const sessionQuestions = useMemo((): Question[] => {
    switch (mode) {
      case 'section':
        return getQuestionsBySection(questions, id!)
      case 'random':
      case 'unanswered':
        return getQuestionsByIds(questions, chainIds)
      case 'wrong':
        return getQuestionsByIds(questions, progress.wrongBook)
      case 'mock':
        if (!mockSession) return []
        return getQuestionsByIds(questions, mockSession.questionIds)
      case 'paper':
        if (!id) return []
        return getPaperQuestions(id)
      default:
        return []
    }
  }, [mode, id, progress.wrongBook, chainIds, mockSession])

  const currentQuestion = sessionQuestions[currentIndex]
  const isLast = currentIndex === sessionQuestions.length - 1
  const isMultiple = currentQuestion?.type === 'multiple'
  const sessionDoneCount = Object.keys(sessionAnswers).length
  const isChainMode = isRandom || isUnanswered

  const buildResultState = useCallback((): PracticeResultState => {
    const entries = Object.entries(sessionAnswersRef.current)
    const correct = entries.filter(([, v]) => v.correct).length
    const total = entries.length
    const wrong = total - correct
    const wrongQuestions = entries
      .filter(([, v]) => !v.correct)
      .map(([qid]) => {
        const fromAll = questions.find((q) => q.id === qid)
        if (fromAll) return fromAll
        return getPaperQuestions(id ?? '').find((q) => q.id === qid)
      })
      .filter((q): q is Question => !!q)

    const nextSection =
      mode === 'section' && id
        ? getNextPracticeSection(chapterCatalog, id)
        : null

    let title = '练习'
    if (mode === 'section') title = section?.title ?? '章节练习'
    else if (mode === 'random') title = '随机练题'
    else if (mode === 'unanswered') title = '未做题库'

    return {
      mode: mode === 'section' ? 'section' : 'random',
      title,
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
    const examTitle = isPaper
      ? (paper?.title ?? '套卷考试')
      : MOCK_EXAM_CONFIG.title
    const examId = isPaper ? (paper?.id ?? id ?? 'paper') : (mockSession?.id ?? 'mock')
    const passScore = isPaper
      ? (paper?.passScore ?? 60)
      : MOCK_EXAM_CONFIG.passScore

    const answers = sessionAnswersRef.current
    const total = sessionQuestions.length
    const correctCount = sessionQuestions.filter((q) => answers[q.id]?.correct).length
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0
    const wrongQuestions = sessionQuestions.filter((q) => !answers[q.id]?.correct)
    const wrongQuestionIds = wrongQuestions.map((q) => q.id)
    const duration = Math.round((Date.now() - startedAt) / 1000)

    addExamResult({
      id: `result-${Date.now()}`,
      mockExamId: examId,
      mockExamTitle: examTitle,
      score,
      total,
      correct: correctCount,
      duration,
      passed: score >= passScore,
      completedAt: Date.now(),
      wrongQuestionIds,
    })

    if (isMock) clearMockExamSession()

    const resultState: ExamResultState = {
      title: examTitle,
      score,
      total,
      correct: correctCount,
      duration,
      passed: score >= passScore,
      passScore,
      wrongQuestions,
    }
    navigate('/result/exam', { state: resultState })
  }, [
    isPaper,
    paper,
    id,
    mockSession,
    sessionQuestions,
    addExamResult,
    navigate,
    startedAt,
    isMock,
  ])

  const handleExitRequest = useCallback(() => {
    setExitDialogOpen(true)
  }, [])

  const handleExitConfirm = useCallback(() => {
    setExitDialogOpen(false)
    if (isTimedExam) {
      if (sessionDoneCount > 0) finishExam()
      else {
        if (isMock) clearMockExamSession()
        navigate('/exams')
      }
      return
    }
    if (sessionDoneCount > 0) finishPractice()
    else navigate(mode === 'section' ? '/chapters' : '/')
  }, [
    isTimedExam,
    sessionDoneCount,
    finishExam,
    finishPractice,
    navigate,
    mode,
    isMock,
  ])

  useEffect(() => {
    if (isMock && !mockSession) navigate('/exams', { replace: true })
  }, [isMock, mockSession, navigate])

  useEffect(() => {
    if (isPaper && !paper) navigate('/exams', { replace: true })
  }, [isPaper, paper, navigate])

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
    if (isMock && mockSession) {
      const elapsed = Math.floor((Date.now() - mockSession.startedAt) / 1000)
      const totalSeconds = mockSession.durationMinutes * 60
      setTimeLeft(Math.max(0, totalSeconds - elapsed))
    } else if (isPaper && paper) {
      setTimeLeft(paper.duration * 60)
    }
  }, [isMock, mockSession, isPaper, paper])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((t) => (t !== null && t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft === null ? null : `${isMock}-${isPaper}-${id}`])

  useEffect(() => {
    if (timeLeft === 0 && isTimedExam) finishExam()
  }, [timeLeft, isTimedExam, finishExam])

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
      if (!isChainMode && !isTimedExam) {
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
    [sessionQuestions, sessionAnswers, progress.answered, isChainMode, isTimedExam],
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
    if (isChainMode) {
      if (currentIndex < sessionQuestions.length - 1) {
        goTo(currentIndex + 1)
        return
      }
      const used = new Set(chainIds)
      const pool = isUnanswered ? unansweredPool : questions
      const next = pickFromPool(pool, used)
      if (!next) {
        finishPractice()
        return
      }
      setSelected([])
      setShowResult(false)
      setChainIds((prev) => {
        const updated = [...prev, next.id]
        setCurrentIndex(updated.length - 1)
        return updated
      })
      return
    }

    if (isLast) {
      if (isTimedExam) finishExam()
      else finishPractice()
      return
    }
    goTo(currentIndex + 1)
  }, [
    isChainMode,
    currentIndex,
    sessionQuestions.length,
    chainIds,
    isUnanswered,
    unansweredPool,
    isLast,
    isTimedExam,
    goTo,
    finishExam,
    finishPractice,
  ])

  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo])

  const swipe = useSwipe({
    onSwipeLeft: () => {
      if (isChainMode && isLast && !showResult) return
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

      if (!isTimedExam) {
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

      if (!isTimedExam && !isMultiple && isCorrect) {
        autoNextTimer.current = setTimeout(() => {
          setSelected([])
          setShowResult(false)
          goNext()
        }, 600)
      }
    },
    [currentQuestion, submitAnswer, isTimedExam, isMultiple, goNext],
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
      case 'unanswered':
        return '未做题库'
      case 'wrong':
        return '错题本'
      case 'mock':
        return MOCK_EXAM_CONFIG.title
      case 'paper':
        return paper?.title ?? '套卷考试'
      default:
        return '练习'
    }
  }

  if (isUnanswered && unansweredPool.length === 0 && sessionDoneCount === 0) {
    return (
      <div className="practice-page">
        <header className="practice-header">
          <button type="button" className="practice-back" onClick={() => navigate('/')}>
            ←
          </button>
          <h1>未做题库</h1>
        </header>
        <div className="empty-state">
          <p>太棒了，题库已全部做过！</p>
          <button type="button" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    )
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
          <button
            type="button"
            onClick={() => navigate(isTimedExam ? '/exams' : '/chapters')}
          >
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
      (!isChainMode && !isTimedExam && progress.answered[currentQuestion.id]?.isCorrect))

  const progressLabel = isChainMode
    ? `已练 ${sessionDoneCount} 题`
    : `${currentIndex + 1} / ${sessionQuestions.length}`

  const exitMessage = isTimedExam
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
        {isChainMode ? (
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

      {isChainMode && (
        <div className="random-status">
          {isUnanswered
            ? `未做题库 · 剩余约 ${Math.max(0, unansweredPool.length - sessionDoneCount)} 题 · ${progressLabel}`
            : `无限模式 · ${progressLabel}`}
        </div>
      )}

      {timeLeft !== null && timeLeft > 0 && (
        <div className={`timer ${timeLeft < 300 ? 'urgent' : ''}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      )}

      {!isChainMode && (
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
            total={isChainMode ? sessionDoneCount + 1 : sessionQuestions.length}
            selected={selected}
            showResult={showResult}
            onSelect={handleSelect}
          />
        )}
      </div>

      <div className="practice-nav-hint">
        {isChainMode
          ? '答对自动下一题 · 随时可点右上角结束并保存'
          : '← 右滑上一题 · 左滑下一题 →'}
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
            {isLast && !isChainMode
              ? isTimedExam
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
        {showResult &&
          !isMultiple &&
          isCorrectNow &&
          isLast &&
          !isTimedExam &&
          !isChainMode && (
            <button type="button" className="btn-primary" onClick={goNext}>
              完成练习
            </button>
          )}
        {isChainMode && sessionDoneCount > 0 && (
          <button type="button" className="btn-outline" onClick={finishPractice}>
            结束并查看记录
          </button>
        )}
        {isTimedExam && sessionDoneCount > 0 && (
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
            Object.entries(sessionAnswers).map(([k, v]) => [
              k,
              { correct: v.correct },
            ]),
          )}
          onJump={goTo}
        />
      )}

      <ConfirmDialog
        open={exitDialogOpen}
        title={isTimedExam ? '退出考试？' : '退出练习？'}
        message={exitMessage}
        cancelLabel="点错了"
        confirmLabel={
          isTimedExam
            ? sessionDoneCount > 0
              ? '交卷退出'
              : '退出'
            : '退出练习'
        }
        onCancel={() => setExitDialogOpen(false)}
        onConfirm={handleExitConfirm}
      />
    </div>
  )
}
