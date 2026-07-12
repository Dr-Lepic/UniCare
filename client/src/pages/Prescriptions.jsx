import { useAuth } from '../context/AuthContext'
import StudentPrescriptions from './StudentPrescriptions'
import DoctorPrescriptions from './DoctorPrescriptions'

export default function Prescriptions() {
  const { user } = useAuth()
  return user?.role === 'doctor' ? <DoctorPrescriptions /> : <StudentPrescriptions />
}
