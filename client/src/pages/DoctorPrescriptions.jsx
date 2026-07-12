import { useEffect, useState } from 'react'
import api from '../api'

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
const emptyRow = () => ({ medicineId: '', dosage: '', qty: 1 })

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([])
  const [students, setStudents]           = useState([])
  const [catalog, setCatalog]             = useState([])   // medicines
  const [studentId, setStudentId]         = useState('')
  const [rows, setRows]                   = useState([emptyRow()])
  const [notes, setNotes]                 = useState('')
  const [error, setError]                 = useState('')
  const [saving, setSaving]               = useState(false)

  const loadMine = () => api.get('/prescriptions/mine').then(r => setPrescriptions(r.data))

  useEffect(() => {
    loadMine()
    api.get('/students').then(r => setStudents(r.data))
    api.get('/medicines').then(r => setCatalog(r.data))
  }, [])

  const stockOf = (id) => catalog.find(m => m._id === id)?.stockQty
  const unitOf  = (id) => catalog.find(m => m._id === id)?.unit

  const updateRow = (i, field, value) =>
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [field]: value } : r))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const medicines = rows
      .filter(r => r.medicineId)
      .map(r => ({ medicineId: r.medicineId, dosage: r.dosage.trim(), qty: Number(r.qty) }))

    if (!studentId) return setError('Select a student.')
    if (medicines.length === 0) return setError('Add at least one medicine.')
    if (medicines.some(m => !m.dosage)) return setError('Every medicine needs a dosage.')
    if (medicines.some(m => !Number.isInteger(m.qty) || m.qty < 1)) return setError('Quantities must be at least 1.')

    setSaving(true)
    try {
      await api.post('/prescriptions', { studentId, medicines, notes: notes.trim() || undefined })
      setStudentId(''); setRows([emptyRow()]); setNotes('')
      loadMine()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save prescription.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard">
      <div className="dash-section">
        <p className="dash-section-title">Write a Prescription</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Patient</label>
            <select value={studentId} onChange={e => setStudentId(e.target.value)}>
              <option value="">Select a student…</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name}{s.studentId ? ` — ${s.studentId}` : ''}{s.department ? ` (${s.department})` : ''}
                </option>
              ))}
            </select>
          </div>

          {rows.map((row, i) => {
            const stock = stockOf(row.medicineId)
            const over  = stock != null && Number(row.qty) > stock
            return (
              <div key={i} className="rx-form-row">
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                  <label>Medicine</label>
                  <select value={row.medicineId} onChange={e => updateRow(i, 'medicineId', e.target.value)}>
                    <option value="">Select…</option>
                    {catalog.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                  {row.medicineId && (
                    <span className={`rx-stock ${over ? 'rx-stock--low' : ''}`}>
                      In stock: {stock} {unitOf(row.medicineId)}{over ? ' · exceeds stock' : ''}
                    </span>
                  )}
                </div>
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                  <label>Dosage</label>
                  <input value={row.dosage} placeholder="1 tablet twice daily" onChange={e => updateRow(i, 'dosage', e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: '0 0 88px', marginBottom: 0 }}>
                  <label>Qty</label>
                  <input type="number" min="1" value={row.qty} onChange={e => updateRow(i, 'qty', e.target.value)} />
                </div>
                <button type="button" className="slot-btn" onClick={() => setRows(rs => rs.filter((_, idx) => idx !== i))} disabled={rows.length === 1}>Remove</button>
              </div>
            )
          })}

          <div className="appt-actions" style={{ margin: '1rem 0' }}>
            <button type="button" className="slot-btn" onClick={() => setRows(rs => [...rs, emptyRow()])}>+ Add medicine</button>
          </div>

          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea rows="2" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Advice, follow-up, sick leave…" />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn-submit" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving…' : 'Save Prescription'}
          </button>
        </form>
      </div>

      <div className="dash-section">
        <p className="dash-section-title">Prescriptions Written</p>
        {prescriptions.length === 0 ? (
          <p className="activity-empty">None yet.</p>
        ) : (
          <div className="rx-list">
            {prescriptions.map(p => (
              <div key={p._id} className="rx-card">
                <div className="rx-card-head">
                  <strong>{p.student?.name}{p.student?.studentId ? ` · ${p.student.studentId}` : ''}</strong>
                  <span className="stat-label">{fmtDate(p.createdAt)}</span>
                </div>
                <ul className="rx-meds">
                  {p.medicines.map((m, i) => (
                    <li key={i}>
                      <span className="rx-med-name">{m.medicine?.name}</span>
                      <span className="rx-med-detail">{m.dosage} · ×{m.qty} {m.medicine?.unit}</span>
                    </li>
                  ))}
                </ul>
                {p.notes && <p className="rx-notes">{p.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
