import { PageHeader } from '../components/Layout'
import { useProgress } from '../hooks/useProgress'
import './Profile.css'

export function ProfilePage() {
  const { stats, progress, resetProgress } = useProgress()

  const handleReset = () => {
    if (window.confirm('确定要清空所有练习记录吗？此操作不可恢复。')) {
      resetProgress()
    }
  }

  return (
    <div className="profile-page">
      <PageHeader title="我的" subtitle="学习数据与设置" />

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="big">{stats.total}</span>
          <span>累计做题</span>
        </div>
        <div className="profile-stat">
          <span className="big">{stats.accuracy}%</span>
          <span>总正确率</span>
        </div>
        <div className="profile-stat">
          <span className="big">{stats.wrongCount}</span>
          <span>错题数</span>
        </div>
      </div>

      {progress.examResults.length > 0 && (
        <section className="profile-section">
          <h2>考试记录</h2>
          <div className="record-list">
            {progress.examResults.slice(0, 10).map((r) => (
              <div key={r.id} className="record-item">
                <div>
                  <strong>{r.mockExamTitle}</strong>
                  <span className="record-date">
                    {new Date(r.completedAt).toLocaleDateString()}
                  </span>
                </div>
                <span className={`record-score ${r.passed ? 'pass' : 'fail'}`}>
                  {r.score}分
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="profile-section">
        <h2>设置</h2>
        <button type="button" className="danger-btn" onClick={handleReset}>
          清空练习记录
        </button>
      </section>
    </div>
  )
}
