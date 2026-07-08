# 练题助手

一个移动端友好的练题应用，支持章节练习、随机练题、模拟考试和错题本。

## 功能

- **章节练习** — 按章节分类刷题，显示进度和正确率
- **随机练题** — 从全部题库随机抽取 10 道题
- **模拟考试** — 限时全真模拟，自动评分
- **错题本** — 自动收集做错的题，方便复习
- **学习统计** — 记录做题数、正确率、考试历史

## 开发

```bash
cd practice-app
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## 导入题库

题目数据在 `src/data/` 目录：

| 文件 | 说明 |
|------|------|
| `chapters.ts` | 章节列表 |
| `questions.ts` | 题目数据 |
| `mockExams.ts` | 模拟卷配置 |

### 题目格式

```typescript
{
  id: 'q001',           // 唯一 ID
  chapterId: 'ch1',     // 所属章节
  type: 'single',       // single | multiple | judge
  question: '题目内容',
  options: ['A. 选项1', 'B. 选项2', 'C. 选项3', 'D. 选项4'],
  answer: 'A',          // 单选/判断: 'A'  多选: ['A', 'B']
  explanation: '解析说明（可选）',
}
```

把题目发给我后，我会按章节整理并导入到这些文件中。

## 技术栈

- React 19 + TypeScript
- Vite
- React Router
- localStorage 本地存储进度
