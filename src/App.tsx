import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import QuizWritingPage from './pages/QuizWritingPage'
import QuizReadingPage from './pages/QuizReadingPage'
import ResultPage from './pages/ResultPage'
import HistoryPage from './pages/HistoryPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz/writing" element={<QuizWritingPage />} />
        <Route path="/quiz/reading" element={<QuizReadingPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </BrowserRouter>
  )
}
