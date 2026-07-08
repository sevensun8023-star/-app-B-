import type { MockExam } from '../types'

export const mockExams: MockExam[] = [
  {
    id: 'exam1',
    title: '模拟卷一',
    description: '安全生产知识专项模拟',
    questionIds: [
      'sk1-001', 'sk1-010', 'sk1-020', 'sk1-030', 'sk1-040',
      'sk1-050', 'sk1-055', 'sk1-060', 'sk1-070', 'sk1-080',
      'sk1-088', 'sk1-095', 'sk1-100', 'sk1-110', 'sk1-120',
      'sk1-130', 'sk1-140', 'sk1-150', 'sk1-160', 'sk1-163',
    ],
    duration: 30,
    passScore: 60,
  },
]
