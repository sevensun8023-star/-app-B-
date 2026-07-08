import { Link } from 'react-router-dom'
import { PageHeader } from '../components/Layout'
import { mockExams } from '../data/mockExams'
import { useProgress } from '../hooks/useProgress'
import './Exams.css'

export function ExamsPage() {
  const { progress } = useProgress()

  return (
    <div className="exams-page">
      <PageHeader title="模拟考试" subtitle="全真模拟，检验学习成果" />

      <div className="exam-list">
        {mockExams.map((exam) => {
          const lastResult = progress.examResults.find(
            (r) => r.mockExamId === exam.id,
          )

          return (
            <div key={exam.id} className="exam-card">
              <div className="exam-card-header">
                <h3>{exam.title}</h3>
                {lastResult && (
                  <span
                    className={`score-badge ${lastResult.passed ? 'pass' : 'fail'}`}
                  >
                    {lastResult.score}分
                  </span>
                )}
              </div>
              {exam.description && (
                <p className="exam-desc">{exam.description}</p>
              )}
              <div className="exam-meta">
                <span>📝 {exam.questionIds.length} 题</span>
                <span>⏱ {exam.duration} 分钟</span>
                <span>✅ {exam.passScore} 分及格</span>
              </div>
              <Link to={`/practice/mock/${exam.id}`} className="start-exam-btn">
                开始考试
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
