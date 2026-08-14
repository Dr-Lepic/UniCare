import { useEffect, useState } from 'react'
import { Calendar, User, Trash2 } from 'lucide-react'
import api from '../api'

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function StudentAppointments() {
  const [doctors, setDoctors]           = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [date, setDate]                 = useState(todayStr())
  const [slots, setSlots]               = useState([])
  const [myAppointments, setMyAppointments] = useState([])
  const [error, setError]               = useState('')
  const [booking, setBooking]           = useState('')

  const loadMine = () => api.get('/appointments/mine').then(r => setMyAppointments(r.data))

  useEffect(() => {
    api.get('/doctors').then(r => setDoctors(r.data))
    loadMine()
  }, [])

  useEffect(() => {
    if (!selectedDoctor) return
    api.get('/appointments/slots', { params: { doctorId: selectedDoctor._id, date } })
      .then(r => setSlots(r.data))
      .catch(() => setSlots([]))
  }, [selectedDoctor, date])

  const handleBook = async (timeSlot) => {
    setError('')
    setBooking(timeSlot)
    try {
      await api.post('/appointments', { doctorId: selectedDoctor._id, date, timeSlot })
      setSlots(s => s.filter(s => s !== timeSlot))
      loadMine()
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed')
    } finally {
      setBooking('')
    }
  }

  const handleCancel = async (id) => {
    await api.patch(`/appointments/${id}`, { status: 'cancelled' })
    loadMine()
  }

  return (
    <div className="dashboard">
      <div className="dash-section">
        <p className="dash-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <User size={16} style={{ color: 'var(--accent)' }} /> Browse Doctors
        </p>
        <div className="doctor-grid">
          {doctors.map(d => (
            <div
              key={d._id}
              className={`doctor-card ${selectedDoctor?._id === d._id ? 'selected' : ''}`}
              onClick={() => setSelectedDoctor(d)}
            >
              <strong>{d.name}</strong>
              <p className="stat-label">{d.specialty || 'General'}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedDoctor && (
        <div className="dash-section">
          <p className="dash-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} style={{ color: 'var(--accent)' }} /> Book with {selectedDoctor.name}
          </p>
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input id="date" type="date" min={todayStr()} value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="slot-grid">
            {slots.length === 0 && <p className="activity-empty">No open slots for this date.</p>}
            {slots.map(s => (
              <button key={s} className="slot-btn" disabled={booking === s} onClick={() => handleBook(s)}>
                {booking === s ? 'Booking…' : s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="dash-section">
        <p className="dash-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={16} style={{ color: 'var(--accent)' }} /> My Appointments
        </p>
        {myAppointments.length === 0 ? (
          <p className="activity-empty">No appointments yet.</p>
        ) : (
          myAppointments.map(a => (
            <div key={a._id} className="appt-row">
              <span>
                {a.doctor?.name} — {a.date.slice(0, 10)} · {a.timeSlot}
              </span>
              <div className="appt-actions">
                <span className={`status-pill status-pill--${a.status}`}>{a.status}</span>
                {(a.status === 'pending' || a.status === 'confirmed') && (
                  <button
                    className="slot-btn"
                    onClick={() => handleCancel(a._id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Trash2 size={13} /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
