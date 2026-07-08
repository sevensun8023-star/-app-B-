import { Link, useLocation } from 'react-router-dom'
import type { Question } from '../types'
import { getTypeLabel } from '../utils/question'
import './Result.css'

export interface PracticeResultState {
  mode: 'random' | 'section'
  title: string
  total: number
  correct: number
  wrong: number
  accuracy: number
  wrongQuestions: Question[]
  nextSectionId?: string
  nextSectionTitle?: string
}

export interface ExamResultState {
  title: string
  score: number
  total: number
  correct: number
  duration: number
  passed: boolean
  passScore: number
  wrongQuestions: Question[]
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s.toString().padStart(2, '0')}秒`
}

function WrongReview({ wrongQuestions }: { wrongQuestions: Question[] }) {
  if (wrongQuestions.length === 0) return null

  return (
    <section className="wrong-review">
      <h2>错题分析（{wrongQuestions.length}）</h2>
      <div className="wrong-list">
        {wrongQuestions.map((q, i) => (
          <div key={q.id} className="wrong-item">
            <div className="wrong-item-head">
              <span className="wrong-num">{i + 1}</span>
              <span className="wrong-type">{getTypeLabel(q.type)}</span>
            </div>
            <p className="wrong-question">{q.question}</p>
            <p className="wrong-answer">
              正确答案：
              {Array.isArray(q.answer) ? q.answer.join('、') : q.answer}
            </p>
            {q.explanation && (
              <p className="wrong-explanation">{q.explanation}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export function ResultPage() {
  const location = useLocation()
  const practiceState = location.state as PracticeResultState | null
  const examState = location.state as ExamResultState | null

  const isExamResult =
    location.pathname === '/result/exam' && examState?.wrongQuestions !== undefined

  if (isExamResult && examState) {
    const { title, score, total, correct, duration, passed, passScore, wrongQuestions } =
      examState

    return (
      <div className="result-page">
        <div className={`result-card ${passed ? 'pass' : 'fail'}`}>
          <div className="result-icon">{passed ? '🎉' : '💪'}</div>
          <h1>{passed ? '恭喜通过！' : '继续加油！'}</h1>
          <p className="result-subtitle">{title}</p>
          <div className="result-score">
            <span className="score-num">{score}</span>
            <span className="score-unit">分</span>
          </div>
          <p className="result-detail">
            答对 {correct} / {total} 题 · 用时 {formatDuration(duration)}
          </p>
          <p className="result-pass-line">
            {passed ? '已达到及格线' : `未达及格线（${passScore} 分）`}
          </p>
        </div>

        <div className="result-stats-grid">
          <div className="result-stat">
            <span className="num">{total}</span>
            <span className="label">总题数</span>
          </div>
          <div className="result-stat correct">
            <span className="num">{correct}</span>
            <span className="label">正确</span>
          </div>
          <div className="result-stat wrong">
            <span className="num">{total - correct}</span>
            <span className="label">错误</span>
          </div>
        </div>

        <WrongReview wrongQuestions={wrongQuestions} />

        <div className="result-actions">
          <Link to="/exams" className="btn-primary-link">
            再考一次
          </Link>
          <Link to="/" className="btn-text-link">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  if (practiceState && (practiceState.mode === 'random' || practiceState.mode === 'section')) {
    const {
      title,
      total: t,
      correct: c,
      wrong: w,
      accuracy,
      wrongQuestions,
      nextSectionId,
      nextSectionTitle,
    } = practiceState
    const passed = accuracy >= 60

    return (
      <div className="result-page">
        <div className={`result-card ${passed ? 'pass' : 'fail'}`}>
          <div className="result-icon">{passed ? '🎉' : '💪'}</div>
          <h1>{practiceState.mode === 'section' ? '章节练习完成' : '练习结束'}</h1>
          <p className="result-subtitle">{title}</p>

          <div className="result-score">
            <span className="score-num">{accuracy}</span>
            <span className="score-unit">%</span>
          </div>
          <p className="result-detail">正确率</p>
        </div>

        <div className="result-stats-grid">
          <div className="result-stat">
            <span className="num">{t}</span>
            <span className="label">做题</span>
          </div>
          <div className="result-stat correct">
            <span className="num">{c}</span>
            <span className="label">正确</span>
          </div>
          <div className="result-stat wrong">
            <span className="num">{w}</span>
            <span className="label">错误</span>
          </div>
        </div>

        <WrongReview wrongQuestions={wrongQuestions} />

        <div className="result-actions">
          {nextSectionId && nextSectionTitle && (
            <Link
              to={`/practice/section/${nextSectionId}`}
              className="btn-primary-link"
            >
              下一章节：{nextSectionTitle}
            </Link>
          )}
          {practiceState.mode === 'random' && (
            <Link to="/practice/random" className="btn-outline">
              再来一轮
            </Link>
          )}
          {practiceState.mode === 'section' && (
            <Link to="/chapters" className="btn-outline">
              返回章节列表
            </Link>
          )}
          <Link to="/" className="btn-text-link">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="result-page">
      <div className="result-card">
        <h1>暂无结果</h1>
        <p className="result-detail">请从练习或考试入口进入</p>
      </div>
      <div className="result-actions">
        <Link to="/" className="btn-primary-link">
          返回首页
        </Link>
      </div>
    </div>
  )
}
