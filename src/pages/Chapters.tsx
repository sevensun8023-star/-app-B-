import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SectionStartModal } from '../components/SectionStartModal'
import { chapterCatalog } from '../data/catalog'
import { getQuestionsBySection, questions } from '../data/questions'
import { useProgress } from '../hooks/useProgress'
import type { SectionNode } from '../types'
import { collectSectionIds, getSectionStats } from '../utils/storage'
import './Chapters.css'

function SectionStats({ node }: { node: SectionNode }) {
  const { progress } = useProgress()
  const sectionIds = useMemo(() => collectSectionIds(node), [node])
  const total =
    sectionIds.length > 0
      ? sectionIds.reduce(
          (sum, id) => sum + questions.filter((q) => q.sectionId === id).length,
          0,
        )
      : (node.expectedTotal ?? 0)
  const stats = getSectionStats(progress, sectionIds)
  const displayTotal = total || node.expectedTotal || 0

  return (
    <span className="node-stats">
      已做 {stats.done} 题，共 {displayTotal} 题, 正确率 {stats.accuracy}%
    </span>
  )
}

function TreeNode({
  node,
  depth = 0,
  defaultOpen = false,
  onPracticeClick,
}: {
  node: SectionNode
  depth?: number
  defaultOpen?: boolean
  onPracticeClick: (node: SectionNode) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const hasChildren = !!node.children?.length
  const isPractice = !!node.practiceId
  const count = node.practiceId
    ? questions.filter((q) => q.sectionId === node.practiceId).length
    : 0

  const content = (
    <>
      <div className="node-row">
        {hasChildren ? (
          <button
            type="button"
            className={`toggle-btn ${open ? 'open' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setOpen((v) => !v)
            }}
            aria-label={open ? '收起' : '展开'}
          >
            {open ? '−' : '+'}
          </button>
        ) : (
          <span className="toggle-placeholder" />
        )}
        <div className="node-content">
          <div className="node-title-row">
            <span className="node-title">{node.title}</span>
            {isPractice && count > 0 && (
              <span className="node-count">{count} 题</span>
            )}
          </div>
          <SectionStats node={node} />
        </div>
      </div>
      {hasChildren && open && (
        <div className="node-children">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onPracticeClick={onPracticeClick}
            />
          ))}
        </div>
      )}
    </>
  )

  if (isPractice) {
    return (
      <div className={`tree-node depth-${depth}`}>
        <button
          type="button"
          className="practice-link"
          onClick={() => onPracticeClick(node)}
        >
          {content}
        </button>
      </div>
    )
  }

  return <div className={`tree-node depth-${depth}`}>{content}</div>
}

export function ChaptersPage() {
  const navigate = useNavigate()
  const { clearSectionProgress } = useProgress()
  const [modalSection, setModalSection] = useState<SectionNode | null>(null)

  const handlePracticeClick = (node: SectionNode) => {
    if (!node.practiceId) return
    const count = getQuestionsBySection(node.practiceId).length
    if (count === 0) return
    setModalSection(node)
  }

  const handleContinue = (startIndex: number) => {
    if (!modalSection?.practiceId) return
    setModalSection(null)
    navigate(`/practice/section/${modalSection.practiceId}`, {
      state: { startIndex },
    })
  }

  const handleRestart = () => {
    if (!modalSection?.practiceId) return
    const sectionQuestions = getQuestionsBySection(modalSection.practiceId)
    clearSectionProgress(modalSection.practiceId, sectionQuestions)
    setModalSection(null)
    navigate(`/practice/section/${modalSection.practiceId}`, {
      state: { startIndex: 0, fresh: true },
    })
  }

  return (
    <div className="chapters-page">
      <header className="chapters-header">
        <Link to="/" className="header-back">
          ←
        </Link>
        <h1>章节练习</h1>
      </header>

      <div className="chapter-tree">
        {chapterCatalog.map((node, index) => (
          <TreeNode
            key={node.id}
            node={node}
            defaultOpen={index === 0}
            onPracticeClick={handlePracticeClick}
          />
        ))}
      </div>

      {modalSection?.practiceId && (
        <SectionStartModal
          practiceId={modalSection.practiceId}
          title={modalSection.title}
          open={!!modalSection}
          onClose={() => setModalSection(null)}
          onContinue={handleContinue}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}
