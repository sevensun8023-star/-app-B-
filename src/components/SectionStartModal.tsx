import { getQuestionsBySection } from '../data/questions'
import { useProgress } from '../hooks/useProgress'
import {
  getSectionDoneCount,
  getSectionResumeIndex,
  hasSectionProgress,
} from '../utils/storage'
import './SectionStartModal.css'

interface SectionStartModalProps {
  practiceId: string
  title: string
  open: boolean
  onClose: () => void
  onContinue: (startIndex: number) => void
  onRestart: () => void
}

export function SectionStartModal({
  practiceId,
  title,
  open,
  onClose,
  onContinue,
  onRestart,
}: SectionStartModalProps) {
  const { progress } = useProgress()
  const sectionQuestions = getQuestionsBySection(practiceId)
  const total = sectionQuestions.length
  const done = getSectionDoneCount(progress, sectionQuestions)
  const hasProgress = hasSectionProgress(progress, sectionQuestions)
  const resumeIndex = getSectionResumeIndex(progress, sectionQuestions)

  if (!open) return null

  return (
    <div className="section-modal-overlay" onClick={onClose}>
      <div className="section-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p className="section-modal-info">
          共 {total} 题
          {hasProgress && (
            <>
              ，已完成 <strong>{done}</strong> 题
              {done < total && (
                <>，将从第 <strong>{resumeIndex + 1}</strong> 题继续</>
              )}
            </>
          )}
        </p>

        <div className="section-modal-actions">
          <button
            type="button"
            className="modal-btn continue"
            disabled={!hasProgress}
            onClick={() => onContinue(resumeIndex)}
          >
            继续练习
          </button>
          <button
            type="button"
            className="modal-btn restart"
            onClick={onRestart}
          >
            重新练习
          </button>
        </div>

        {!hasProgress && (
          <p className="section-modal-hint">暂无练习记录，请开始新练习</p>
        )}

        {hasProgress && done >= total && (
          <p className="section-modal-hint">本章已全部完成，重新练习将清除记录</p>
        )}

        <button type="button" className="section-modal-cancel" onClick={onClose}>
          取消
        </button>
      </div>
    </div>
  )
}
