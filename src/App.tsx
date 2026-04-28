import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import QuizWritingPage from './pages/QuizWritingPage'
import QuizReadingPage from './pages/QuizReadingPage'
import GradingPage from './pages/GradingPage'
import ResultPage from './pages/ResultPage'
import HistoryPage from './pages/HistoryPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz/writing" element={<QuizWritingPage />} />
        <Route path="/quiz/reading" element={<QuizReadingPage />} />
        <Route path="/grading" element={<GradingPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </BrowserRouter>
  )
}
