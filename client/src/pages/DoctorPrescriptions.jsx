import { useEffect, useState, useRef } from 'react'
import api from '../api'

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
const emptyRow = () => ({ medicineId: '', dosage: '', qty: 1 })

function MedicineSelect({ catalog, value, onChange }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (value) {
      const m = catalog.find(x => x._id === value)
      if (m) setQuery(m.name)
    } else {
      setQuery('')
    }
  }, [value, catalog])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filtered = catalog.filter(m => m.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input 
        type="text" 
        value={query}
        onChange={e => { 
          setQuery(e.target.value)
          setIsOpen(true)
          if (value) onChange('') // clear selection if user types
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Type to search medicine..."
        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
      />
      {isOpen && filtered.length > 0 && (
        <ul style={{ 
          position: 'absolute', zIndex: 10, background: 'var(--bg)', 
          border: '1px solid var(--border)', width: '100%', maxHeight: '150px', 
          overflowY: 'auto', listStyle: 'none', padding: 0, margin: 0, 
          borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
        }}>
          {filtered.map(m => (
            <li 
              key={m._id} 
              style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid var(--border)', color: 'var(--text)' }}
              onMouseDown={() => { onChange(m._id); setQuery(m.name); setIsOpen(false); }}
            >
              {m.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({m.stockQty} {m.unit} in stock)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([])
  const [students, setStudents]           = useState([])
  const [appointments, setAppointments]   = useState([])
  const [catalog, setCatalog]             = useState([])
  
  const [studentId, setStudentId]         = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentSearch, setStudentSearch] = useState('')
  
  const [symptoms, setSymptoms]           = useState('')
  const [diagnosis, setDiagnosis]         = useState('')
  const [tests, setTests]                 = useState('')
  const [notes, setNotes]                 = useState('')
  
  const [rows, setRows]                   = useState([emptyRow()])
  const [error, setError]                 = useState('')
  const [saving, setSaving]               = useState(false)

  const loadMine = () => api.get('/prescriptions/mine').then(r => setPrescriptions(r.data))

  useEffect(() => {
    loadMine()
    api.get('/students').then(r => setStudents(r.data))
    api.get('/medicines').then(r => setCatalog(r.data))
    api.get('/appointments/mine').then(r => setAppointments(r.data))
  }, [])

  const stockOf = (id) => catalog.find(m => m._id === id)?.stockQty
  const unitOf  = (id) => catalog.find(m => m._id === id)?.unit

  const updateRow = (i, field, value) =>
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [field]: value } : r))

  const handleStudentSearch = (e) => {
    const val = e.target.value
    setStudentSearch(val)
    const found = students.find(s => s.studentId === val)
    if (found) {
      setStudentId(found._id)
      setSelectedStudent(found)
    } else {
      setStudentId('')
      setSelectedStudent(null)
    }
  }

  const handleAppointmentSelect = (e) => {
    const apptId = e.target.value
    if (!apptId) return
    const appt = appointments.find(a => a._id === apptId)
    if (appt) {
      setStudentId(appt.student._id)
      const fullStudent = students.find(s => s._id === appt.student._id)
      setSelectedStudent(fullStudent || appt.student)
      setStudentSearch(fullStudent?.studentId || '')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const medicines = rows
      .filter(r => r.medicineId)
      .map(r => ({ medicineId: r.medicineId, dosage: r.dosage.trim(), qty: Number(r.qty) }))

    if (!studentId) return setError('Please select a valid student or appointment.')
    if (medicines.length === 0) return setError('Add at least one medicine.')
    if (medicines.some(m => !m.dosage)) return setError('Every medicine needs a dosage.')
    if (medicines.some(m => !Number.isInteger(m.qty) || m.qty < 1)) return setError('Quantities must be at least 1.')

    setSaving(true)
    try {
      await api.post('/prescriptions', { 
        studentId, 
        symptoms: symptoms.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        tests: tests.trim() || undefined,
        medicines, 
        notes: notes.trim() || undefined 
      })
      
      setStudentId(''); setSelectedStudent(null); setStudentSearch('');
      setSymptoms(''); setDiagnosis(''); setTests(''); setNotes('');
      setRows([emptyRow()]); 
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
            <label>Patient Selection</label>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Enter Student ID..." 
                value={studentSearch} 
                onChange={handleStudentSearch} 
                style={{ flex: 1, minWidth: '200px' }} 
              />
              <span style={{ padding: '8px 0' }}>OR</span>
              <select onChange={handleAppointmentSelect} style={{ flex: 1, minWidth: '200px' }} defaultValue="">
                <option value="">-- Select from confirmed appointments --</option>
                {appointments.filter(a => a.status === 'confirmed' || a.status === 'completed').map(a => (
                  <option key={a._id} value={a._id}>{fmtDate(a.date)} - {a.timeSlot} - {a.student.name}</option>
                ))}
              </select>
            </div>
            
            {selectedStudent ? (
              <div style={{ background: 'var(--surface, #1e1e1e)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.95rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div><strong>Name:</strong> {selectedStudent.name}</div>
                  <div><strong>ID:</strong> {selectedStudent.studentId || 'N/A'}</div>
                  <div><strong>Age:</strong> {selectedStudent.age || 'N/A'}</div>
                  <div><strong>Contact:</strong> {selectedStudent.contact || 'N/A'}</div>
                  <div><strong>Dept:</strong> {selectedStudent.department || 'N/A'}</div>
                  <div><strong>Program:</strong> {selectedStudent.program || 'N/A'}</div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '1rem', background: 'var(--surface, #1e1e1e)', borderRadius: '8px', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
                No student selected. Enter an ID or select an appointment to autofill details.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label>Symptoms</label>
              <textarea rows="2" value={symptoms} onChange={e => setSymptoms(e.target.value)} placeholder="E.g., Fever, Headache, Cough" />
            </div>
            <div className="form-group">
              <label>Diagnosis / Verdict</label>
              <textarea rows="2" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="E.g., Viral Fever" />
            </div>
          </div>
          
          <div className="form-group">
            <label>Tests Suggested</label>
            <textarea rows="2" value={tests} onChange={e => setTests(e.target.value)} placeholder="E.g., CBC, Dengue NS1" />
          </div>

          <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
            <strong>Medicines</strong>
            <hr style={{ border: 'none', borderBottom: '1px solid var(--border)', margin: '0.5rem 0 1rem 0' }} />
          </div>

          {rows.map((row, i) => {
            const stock = stockOf(row.medicineId)
            const over  = stock != null && Number(row.qty) > stock
            return (
              <div key={i} className="rx-form-row" style={{ alignItems: 'flex-start' }}>
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                  <label>Medicine</label>
                  <MedicineSelect 
                    catalog={catalog} 
                    value={row.medicineId} 
                    onChange={(val) => updateRow(i, 'medicineId', val)} 
                  />
                  {row.medicineId && (
                    <div className={`rx-stock ${over ? 'rx-stock--low' : ''}`} style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                      In stock: {stock} {unitOf(row.medicineId)}{over ? ' · exceeds stock' : ''}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                  <label>Dosage</label>
                  <input value={row.dosage} placeholder="1 tablet twice daily" onChange={e => updateRow(i, 'dosage', e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: '0 0 80px', marginBottom: 0 }}>
                  <label>Qty</label>
                  <input type="number" min="1" value={row.qty} onChange={e => updateRow(i, 'qty', e.target.value)} />
                </div>
                <div style={{ paddingTop: '1.75rem' }}>
                  <button type="button" className="slot-btn" onClick={() => setRows(rs => rs.filter((_, idx) => idx !== i))} disabled={rows.length === 1}>Remove</button>
                </div>
              </div>
            )
          })}

          <div className="appt-actions" style={{ margin: '1rem 0' }}>
            <button type="button" className="slot-btn" onClick={() => setRows(rs => [...rs, emptyRow()])}>+ Add medicine</button>
          </div>

          <div className="form-group">
            <label>Additional Notes / Advice (optional)</label>
            <textarea rows="2" value={notes} onChange={e => setNotes(e.target.value)} placeholder="E.g., Drink plenty of water, sick leave 2 days..." />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn-submit" style={{ width: 'auto', marginTop: '1rem' }} disabled={saving}>
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
                
                <div style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
                  {p.diagnosis && <div><strong>Diagnosis:</strong> {p.diagnosis}</div>}
                  {p.symptoms && <div><strong>Symptoms:</strong> {p.symptoms}</div>}
                  {p.tests && <div><strong>Tests:</strong> {p.tests}</div>}
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
