import type { Question } from '../types'
import { getAnswerStatus, groupQuestionsByType } from '../utils/practice'
import './AnswerSheet.css'

interface AnswerSheetProps {
  open: boolean
  onClose: () => void
  questions: Question[]
  currentIndex: number
  progress: { answered: Record<string, { isCorrect: boolean }> }
  sessionAnswers: Record<string, { correct: boolean }>
  onJump: (index: number) => void
}

const TYPE_LABELS = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
} as const

function TypeGroup({
  label,
  items,
  questions,
  currentIndex,
  progress,
  sessionAnswers,
  onJump,
}: {
  label: string
  items: Question[]
  questions: Question[]
  currentIndex: number
  progress: AnswerSheetProps['progress']
  sessionAnswers: AnswerSheetProps['sessionAnswers']
  onJump: (index: number) => void
}) {
  if (items.length === 0) return null

  const done = items.filter(
    (q) => getAnswerStatus(q, progress, sessionAnswers) !== 'unanswered',
  ).length

  return (
    <div className="sheet-group">
      <div className="sheet-group-header">
        <span>{label}</span>
        <span className="sheet-group-meta">
          已做 {done} / 未做 {items.length - done}
        </span>
      </div>
      <div className="sheet-grid">
        {items.map((q) => {
          const globalIndex = questions.indexOf(q)
          const status = getAnswerStatus(q, progress, sessionAnswers)
          return (
            <button
              key={q.id}
              type="button"
              className={`sheet-cell ${status} ${globalIndex === currentIndex ? 'current' : ''}`}
              onClick={() => onJump(globalIndex)}
            >
              {globalIndex + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function AnswerSheet({
  open,
  onClose,
  questions,
  currentIndex,
  progress,
  sessionAnswers,
  onJump,
}: AnswerSheetProps) {
  if (!open) return null

  const grouped = groupQuestionsByType(questions)

  return (
    <div className="answer-sheet-overlay" onClick={onClose}>
      <div className="answer-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2>答题卡</h2>
          <button type="button" className="sheet-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="sheet-legend">
          <span><i className="dot correct" />答对</span>
          <span><i className="dot wrong" />答错</span>
          <span><i className="dot unanswered" />未答</span>
          <span><i className="dot current" />当前</span>
        </div>

        <div className="sheet-body">
          <TypeGroup
            label={TYPE_LABELS.single}
            items={grouped.single}
            questions={questions}
            currentIndex={currentIndex}
            progress={progress}
            sessionAnswers={sessionAnswers}
            onJump={onJump}
          />
          <TypeGroup
            label={TYPE_LABELS.multiple}
            items={grouped.multiple}
            questions={questions}
            currentIndex={currentIndex}
            progress={progress}
            sessionAnswers={sessionAnswers}
            onJump={onJump}
          />
          <TypeGroup
            label={TYPE_LABELS.judge}
            items={grouped.judge}
            questions={questions}
            currentIndex={currentIndex}
            progress={progress}
            sessionAnswers={sessionAnswers}
            onJump={onJump}
          />
        </div>
      </div>
    </div>
  )
}
