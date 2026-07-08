import { Link, useLocation, useSearchParams } from 'react-router-dom'
import type { Question } from '../types'
import { mockExams } from '../data/mockExams'
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

export function ResultPage() {
  const [params] = useSearchParams()
  const location = useLocation()
  const practiceState = location.state as PracticeResultState | null

  const score = Number(params.get('score') ?? 0)
  const correct = Number(params.get('correct') ?? 0)
  const total = Number(params.get('total') ?? 0)
  const mode = params.get('mode')

  const { pathname } = window.location
  const examId = pathname.split('/result/')[1]?.split('?')[0]
  const mockExam = examId && examId !== 'practice' ? mockExams.find((e) => e.id === examId) : null
  const isExam = !!mockExam

  if (practiceState && (practiceState.mode === 'random' || practiceState.mode === 'section')) {
    const { title, total: t, correct: c, wrong: w, accuracy, wrongQuestions, nextSectionId, nextSectionTitle } = practiceState
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

        {wrongQuestions.length > 0 && (
          <section className="wrong-review">
            <h2>错题回顾（{wrongQuestions.length}）</h2>
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
        )}

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

  const passed = mockExam ? score >= mockExam.passScore : correct / total >= 0.6
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const displayScore = isExam ? score : accuracy

  return (
    <div className="result-page">
      <div className={`result-card ${passed ? 'pass' : 'fail'}`}>
        <div className="result-icon">{passed ? '🎉' : '💪'}</div>
        <h1>{passed ? '恭喜通过！' : '继续加油！'}</h1>
        <div className="result-score">
          <span className="score-num">{displayScore}</span>
          <span className="score-unit">{isExam ? '分' : '%'}</span>
        </div>
        <p className="result-detail">
          答对 {correct} / {total} 题
        </p>
      </div>

      <div className="result-actions">
        {isExam && (
          <Link to={`/practice/mock/${mockExam!.id}`} className="btn-outline">
            再考一次
          </Link>
        )}
        {mode === 'wrong' && (
          <Link to="/practice/wrong" className="btn-outline">
            继续复习错题
          </Link>
        )}
        <Link to="/" className="btn-primary-link">
          返回首页
        </Link>
      </div>
    </div>
  )
}
