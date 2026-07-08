import type { SectionNode } from '../types'

export const EXAM_DATE = '2026-07-18'

export const chapterCatalog: SectionNode[] = [
  {
    id: 'basic',
    title: '基础练习题【含解析】',
    children: [
      {
        id: 'basic-safety',
        title: '安全生产知识部分',
        children: [
          { id: 'basic-safety-1', title: '安全生产知识（1）', practiceId: 'basic-safety-1' },
          { id: 'basic-safety-2', title: '安全生产知识（2）', practiceId: 'basic-safety-2' },
        ],
      },
      {
        id: 'basic-law',
        title: '法规部分',
        children: Array.from({ length: 9 }, (_, i) => ({
          id: `basic-law-${i + 1}`,
          title: `法规部分（${i + 1}）`,
          practiceId: `basic-law-${i + 1}`,
        })),
      },
      {
        id: 'basic-tech',
        title: '技术部分 (1)',
        children: Array.from({ length: 12 }, (_, i) => ({
          id: `basic-tech-${i + 1}`,
          title: `技术部分（${i + 1}）`,
          practiceId: `basic-tech-${i + 1}`,
        })),
      },
      {
        id: 'basic-tech-2',
        title: '技术部分 (2)',
        children: [
          { id: 'tech2-1', title: '拆除工程', practiceId: 'tech2-1' },
          { id: 'tech2-2', title: '垂直运输', practiceId: 'tech2-2' },
          { id: 'tech2-3', title: '职业卫生', practiceId: 'tech2-3' },
          { id: 'tech2-4', title: '高处作业', practiceId: 'tech2-4' },
          { id: 'tech2-5', title: '焊接工程', practiceId: 'tech2-5' },
          { id: 'tech2-6', title: '季节施工', practiceId: 'tech2-6' },
          { id: 'tech2-7', title: '压力容器', practiceId: 'tech2-7' },
          { id: 'tech2-8', title: '脚手架', practiceId: 'tech2-8' },
          { id: 'tech2-9', title: '临时用电', practiceId: 'tech2-9' },
          { id: 'tech2-10', title: '模板工程', practiceId: 'tech2-10' },
          { id: 'tech2-11', title: '起重吊装', practiceId: 'tech2-11' },
          { id: 'tech2-12', title: '施工防火', practiceId: 'tech2-12' },
          { id: 'tech2-13', title: '土方工程', practiceId: 'tech2-13' },
        ],
      },
    ],
  },
  {
    id: 'special',
    title: '专项练习题【含解析】',
    children: [
      { id: 'special-new-1', title: '新增考题（1）', practiceId: 'special-new-1' },
      { id: 'special-new-2', title: '新增考题（2）', practiceId: 'special-new-2' },
      { id: 'special-new-3', title: '新增考题（3）', practiceId: 'special-new-3' },
    ],
  },
]

export function getPracticeSections(catalog: SectionNode[]): SectionNode[] {
  const result: SectionNode[] = []
  const walk = (nodes: SectionNode[]) => {
    for (const node of nodes) {
      if (node.practiceId) result.push(node)
      if (node.children) walk(node.children)
    }
  }
  walk(catalog)
  return result
}

export function getNextPracticeSection(
  catalog: SectionNode[],
  currentPracticeId: string,
): SectionNode | null {
  const sections = getPracticeSections(catalog)
  const idx = sections.findIndex((s) => s.practiceId === currentPracticeId)
  if (idx === -1 || idx >= sections.length - 1) return null
  return sections[idx + 1]
}

export function findSectionById(
  catalog: SectionNode[],
  id: string,
): SectionNode | null {
  for (const node of catalog) {
    if (node.id === id || node.practiceId === id) return node
    if (node.children) {
      const found = findSectionById(node.children, id)
      if (found) return found
    }
  }
  return null
}
