import { Routes, Route, Navigate } from 'react-router-dom'
import Login          from './pages/Login'
import PanelLayout    from './pages/PanelLayout'
import Dashboard      from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/panel/:role"
        element={<ProtectedRoute><PanelLayout /></ProtectedRoute>}
      >
        <Route path="dashboard" element={<Dashboard />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
