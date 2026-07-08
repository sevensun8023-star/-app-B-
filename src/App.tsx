import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProgressProvider } from './hooks/useProgress'
import { ChaptersPage } from './pages/Chapters'
import { ExamsPage } from './pages/Exams'
import { HomePage } from './pages/Home'
import { PracticePage } from './pages/Practice'
import { ProfilePage } from './pages/Profile'
import { ResultPage } from './pages/Result'

export default function App() {
  return (
    <ProgressProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chapters" element={<ChaptersPage />} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/practice/:mode" element={<PracticePage />} />
            <Route path="/practice/:mode/:id" element={<PracticePage />} />
            <Route path="/result/:id" element={<ResultPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ProgressProvider>
  )
}
