import { Link } from 'react-router-dom'
import { EXAM_DATE } from '../data/catalog'
import { getTotalQuestionCount, questions } from '../data/questions'
import { useProgress } from '../hooks/useProgress'
import { getExamProgress } from '../utils/practice'
import './Home.css'

export function HomePage() {
  const { stats, progress } = useProgress()
  const total = getTotalQuestionCount()
  const answeredIds = new Set(Object.keys(progress.answered))
  const exam = getExamProgress(total, answeredIds, EXAM_DATE)

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>练题助手</h1>
        <p>考试日期：7月18日</p>
      </header>

      <div className="exam-countdown-card">
        <div className="countdown-top">
          <span className="countdown-days">{exam.daysLeft}</span>
          <span className="countdown-unit">天</span>
        </div>
        <p className="countdown-label">距离考试还剩</p>
        <div className="exam-progress-bar">
          <div className="exam-progress-fill" style={{ width: `${exam.percent}%` }} />
        </div>
        <div className="exam-progress-stats">
          <span>已完成 {exam.done} / {total} 题</span>
          <span>{exam.percent}%</span>
        </div>
      </div>

      <div className="daily-plan-card">
        <div className="daily-plan-icon">📋</div>
        <div>
          <h3>今日学习计划</h3>
          <p>
            还剩 <strong>{exam.remaining}</strong> 题未做，
            建议每天至少做 <strong>{exam.dailyNeeded}</strong> 题
          </p>
          {exam.daysLeft === 0 && (
            <p className="urgent-text">今天就是考试日，加油！</p>
          )}
        </div>
      </div>

      <div className="stats-card">
        <div className="stat-item">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">已做题</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">{stats.accuracy}%</span>
          <span className="stat-label">正确率</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">{stats.wrongCount}</span>
          <span className="stat-label">错题</span>
        </div>
      </div>

      <div className="quick-actions">
        <Link to="/practice/random" className="action-card primary">
          <span className="action-icon">🎲</span>
          <div>
            <h3>随机练题</h3>
            <p>从 {total} 道题中随机抽取</p>
          </div>
        </Link>

        <Link to="/practice/wrong" className="action-card">
          <span className="action-icon">❌</span>
          <div>
            <h3>错题本</h3>
            <p>{stats.wrongCount} 道待复习</p>
          </div>
        </Link>
      </div>

      <section className="section">
        <div className="section-header">
          <h2>章节练习</h2>
          <Link to="/chapters" className="see-all">
            全部 {questions.length > 0 ? `(${total}题)` : ''} →
          </Link>
        </div>
        <Link to="/chapters" className="chapter-entry">
          <span>按章节刷题</span>
          <span>39 个小节 →</span>
        </Link>
      </section>
    </div>
  )
}
