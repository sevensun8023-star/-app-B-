import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/Layout'
import { questions } from '../data/questions'
import { PAPER_CATEGORIES, papers } from '../data/papers'
import { MOCK_EXAM_CONFIG } from '../data/mockExams'
import { useProgress } from '../hooks/useProgress'
import { createMockExamSession, saveMockExamSession } from '../utils/mockExam'
import './Exams.css'

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s.toString().padStart(2, '0')}秒`
}

export function ExamsPage() {
  const navigate = useNavigate()
  const { progress } = useProgress()
  const history = progress.examResults

  const handleRandomExam = () => {
    const session = createMockExamSession(questions)
    saveMockExamSession(session)
    navigate('/practice/mock/session')
  }

  const handlePaper = (paperId: string) => {
    navigate(`/practice/paper/${paperId}`)
  }

  const recentScores = history.slice(0, 5).map((r) => r.score)
  const bestScore = history.length > 0 ? Math.max(...history.map((r) => r.score)) : null

  return (
    <div className="exams-page">
      <PageHeader title="模拟考试" subtitle="套卷练习 + 随机抽题" />

      {PAPER_CATEGORIES.map((cat) => {
        const list = papers.filter((p) => p.category === cat)
        if (list.length === 0) return null
        return (
          <section key={cat} className="paper-section">
            <h3 className="paper-section-title">{cat}试卷</h3>
            <div className="exam-list">
              {list.map((paper) => {
                const last = history.find((r) => r.mockExamId === paper.id)
                return (
                  <div key={paper.id} className="exam-card">
                    <div className="exam-card-header">
                      <h3>{paper.title}</h3>
                      {last && (
                        <span className={`score-badge ${last.passed ? 'pass' : 'fail'}`}>
                          {last.score}分
                        </span>
                      )}
                    </div>
                    <div className="exam-meta">
                      <span>📝 {paper.questionIds.length} 题</span>
                      <span>⏱ {paper.duration} 分钟</span>
                      <span>✅ {paper.passScore} 分及格</span>
                    </div>
                    <button
                      type="button"
                      className="start-exam-btn"
                      onClick={() => handlePaper(paper.id)}
                    >
                      开始考试
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      <section className="paper-section">
        <h3 className="paper-section-title">随机抽题</h3>
        <div className="exam-card exam-card-main">
          <div className="exam-card-header">
            <h3>{MOCK_EXAM_CONFIG.title}</h3>
          </div>
          <p className="exam-desc">{MOCK_EXAM_CONFIG.description}</p>
          <div className="exam-meta">
            <span>📝 {MOCK_EXAM_CONFIG.questionCount} 题</span>
            <span>⏱ {MOCK_EXAM_CONFIG.duration} 分钟</span>
            <span>✅ {MOCK_EXAM_CONFIG.passScore} 分及格</span>
          </div>
          {bestScore !== null && (
            <p className="exam-best">历史最高分：{bestScore} 分</p>
          )}
          <button type="button" className="start-exam-btn" onClick={handleRandomExam}>
            开始随机考试
          </button>
        </div>
      </section>

      {recentScores.length >= 2 && (
        <div className="exam-trend">
          <h4>最近进步</h4>
          <p className="trend-scores">
            {recentScores
              .slice()
              .reverse()
              .map((s, i, arr) => (
                <span key={i}>
                  {s}分{i < arr.length - 1 ? ' → ' : ''}
                </span>
              ))}
          </p>
        </div>
      )}

      {history.length > 0 && (
        <section className="exam-history">
          <h3>考试记录</h3>
          <div className="history-list">
            {history.map((result) => (
              <div key={result.id} className="history-item">
                <div className="history-main">
                  <span className={`history-score ${result.passed ? 'pass' : 'fail'}`}>
                    {result.score} 分
                  </span>
                  <span className="history-detail">
                    {result.mockExamTitle} · 答对 {result.correct}/{result.total} · 用时{' '}
                    {formatDuration(result.duration)}
                  </span>
                </div>
                <span className="history-date">{formatDate(result.completedAt)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
