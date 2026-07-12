import { useAuth } from '../context/AuthContext'
import StudentAppointments from './StudentAppointments'
import DoctorQueue from './DoctorQueue'

export default function Appointments() {
  const { user } = useAuth()
  return user?.role === 'doctor' ? <DoctorQueue /> : <StudentAppointments />
}
