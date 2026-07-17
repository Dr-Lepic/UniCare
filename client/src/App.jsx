import { Routes, Route, Navigate } from 'react-router-dom'
import Login          from './pages/Login'
import PanelLayout    from './pages/PanelLayout'
import Dashboard      from './pages/Dashboard'
import Appointments   from './pages/Appointments'
import Prescriptions  from './pages/Prescriptions'
import SharedPrescription from './pages/SharedPrescription'
import ProtectedRoute from './components/ProtectedRoute'
import Dispense       from './pages/Dispense'
import StudentReimbursements from './pages/StudentReimbursements'
import DoctorClaims   from './pages/DoctorClaims'
import PharmacistInventory from './pages/PharmacistInventory'
import PharmacistRestockLog from './pages/PharmacistRestockLog'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Public shareable prescription — no auth */}
      <Route path="/rx/:token" element={<SharedPrescription />} />

      <Route
        path="/panel/:role"
        element={<ProtectedRoute><PanelLayout /></ProtectedRoute>}
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="prescriptions" element={<Prescriptions />} />
        <Route path="dispense" element={<Dispense />} />
        <Route path="reimbursements" element={<StudentReimbursements />} />
        <Route path="claims" element={<DoctorClaims />} />
        <Route path="inventory" element={<PharmacistInventory />} />
        <Route path="restock-log" element={<PharmacistRestockLog />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
