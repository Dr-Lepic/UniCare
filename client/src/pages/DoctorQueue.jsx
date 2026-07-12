import { useEffect, useState } from 'react'
import api from '../api'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const emptySlot = () => ({ dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotDurationMinutes: 30 })

const NEXT_ACTION = {
  pending:   [{ label: 'Accept',   status: 'confirmed' }, { label: 'Cancel', status: 'cancelled' }],
  confirmed: [{ label: 'Complete', status: 'completed' }, { label: 'Cancel', status: 'cancelled' }],
}

export default function DoctorQueue() {
  const [availability, setAvailability] = useState([])
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [appointments, setAppointments] = useState([])

  const loadQueue = () => api.get('/appointments/mine').then(r => setAppointments(r.data))

  useEffect(() => {
    api.get('/auth/me').then(r => setAvailability(r.data.availability || []))
    loadQueue()
  }, [])

  const updateSlot = (i, field, value) => {
    setAvailability(a => a.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await api.put('/doctors/me/availability', {
        availability: availability.map(s => ({
          dayOfWeek: Number(s.dayOfWeek),
          startTime: s.startTime,
          endTime: s.endTime,
          slotDurationMinutes: Number(s.slotDurationMinutes),
        })),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const handleAction = async (id, status) => {
    await api.patch(`/appointments/${id}`, { status })
    loadQueue()
  }

  return (
    <div className="dashboard">
      <div className="dash-section">
        <p className="dash-section-title">My Availability</p>
        {availability.map((s, i) => (
          <div key={i} className="appt-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Day</label>
              <select value={s.dayOfWeek} onChange={e => updateSlot(i, 'dayOfWeek', e.target.value)}>
                {DAYS.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Start</label>
              <input type="time" value={s.startTime} onChange={e => updateSlot(i, 'startTime', e.target.value)} />
            </div>
            <div className="form-group">
              <label>End</label>
              <input type="time" value={s.endTime} onChange={e => updateSlot(i, 'endTime', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Slot (min)</label>
              <input
                type="number" min="5" value={s.slotDurationMinutes}
                onChange={e => updateSlot(i, 'slotDurationMinutes', e.target.value)}
              />
            </div>
            <button className="slot-btn" onClick={() => setAvailability(a => a.filter((_, idx) => idx !== i))}>Remove</button>
          </div>
        ))}
        <div className="appt-actions" style={{ marginTop: '1rem' }}>
          <button className="slot-btn" onClick={() => setAvailability(a => [...a, emptySlot()])}>+ Add availability</button>
          <button className="btn-submit" style={{ width: 'auto' }} disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Availability'}
          </button>
        </div>
      </div>

      <div className="dash-section">
        <p className="dash-section-title">Appointment Queue</p>
        {appointments.length === 0 ? (
          <p className="activity-empty">No appointments yet.</p>
        ) : (
          appointments.map(a => (
            <div key={a._id} className="appt-row">
              <span>{a.student?.name} — {a.date.slice(0, 10)} · {a.timeSlot}</span>
              <div className="appt-actions">
                <span className={`status-pill status-pill--${a.status}`}>{a.status}</span>
                {(NEXT_ACTION[a.status] || []).map(({ label, status }) => (
                  <button key={status} className="slot-btn" onClick={() => handleAction(a._id, status)}>{label}</button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
