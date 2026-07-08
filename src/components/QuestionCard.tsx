import type { Question } from '../types'
import { getOptionLetter, getTypeLabel } from '../utils/question'
import './QuestionCard.css'

interface QuestionCardProps {
  question: Question
  index: number
  total: number
  selected: string[]
  showResult?: boolean
  onSelect: (letters: string[]) => void
}

export function QuestionCard({
  question,
  index,
  total,
  selected,
  showResult,
  onSelect,
}: QuestionCardProps) {
  const correctAnswers = Array.isArray(question.answer)
    ? question.answer
    : [question.answer]
  const isMultiple = question.type === 'multiple'

  const toggle = (letter: string) => {
    if (showResult) return
    if (isMultiple) {
      onSelect(
        selected.includes(letter)
          ? selected.filter((s) => s !== letter)
          : [...selected, letter],
      )
    } else {
      onSelect([letter])
    }
  }

  const optionClass = (letter: string) => {
    const classes = ['option']
    if (selected.includes(letter)) classes.push('selected')
    if (showResult) {
      if (correctAnswers.includes(letter)) classes.push('correct')
      else if (selected.includes(letter)) classes.push('wrong')
    }
    return classes.join(' ')
  }

  return (
    <div className="question-card">
      <div className="question-meta">
        <span className="type-badge">{getTypeLabel(question.type)}</span>
        <span className="progress-text">
          {index + 1} / {total}
        </span>
      </div>

      <h2 className="question-text">{question.question}</h2>

      <div className="options">
        {question.options.map((opt) => {
          const letter = getOptionLetter(opt)
          return (
            <button
              key={letter}
              type="button"
              className={optionClass(letter)}
              onClick={() => toggle(letter)}
            >
              <span className="option-letter">{letter}</span>
              <span className="option-content">{opt.slice(3)}</span>
            </button>
          )
        })}
      </div>

      {showResult && question.explanation && (
        <div className="explanation">
          <strong>解析：</strong>
          {question.explanation}
        </div>
      )}
    </div>
  )
}
