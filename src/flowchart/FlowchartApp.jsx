import { Routes, Route } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import EditorPage from './pages/EditorPage'

export default function FlowchartApp() {
  return (
    <Routes>
      <Route index element={<DashboardPage />} />
      <Route path="editor/:id" element={<EditorPage />} />
    </Routes>
  )
}
