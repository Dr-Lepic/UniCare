import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

export default function SharedPrescription() {
  const { token } = useParams()
  const [rx, setRx]           = useState(null)
  const [status, setStatus]   = useState('loading') // loading | ok | expired | notfound | error

  useEffect(() => {
    api.get(`/prescriptions/share/${token}`)
      .then(r => { setRx(r.data); setStatus('ok') })
      .catch(err => {
        const code = err.response?.status
        setStatus(code === 410 ? 'expired' : code === 404 ? 'notfound' : 'error')
      })
  }, [token])

  const message = {
    loading:  'Loading prescription…',
    expired:  'This prescription link has expired.',
    notfound: 'This prescription link is invalid.',
    error:    'Something went wrong. Please try again.',
  }[status]

  return (
    <div className="share-page">
      <div className="share-card">
        <div className="share-brand">
          <span className="share-brand-icon">🏥</span>
          <span>UniCare</span>
        </div>

        {status !== 'ok' ? (
          <p className="share-message">{message}</p>
        ) : (
          <>
            <div className="share-head">
              <div>
                <p className="dash-section-title" style={{ margin: 0 }}>Prescription</p>
                <h2 className="share-name">{rx.student?.name}</h2>
                {rx.student?.studentId && <p className="stat-label">{rx.student.studentId}</p>}
              </div>
              <span className="stat-label">{fmtDate(rx.createdAt)}</span>
            </div>

            <p className="share-doctor">
              Prescribed by <strong>{rx.doctor?.name}</strong>
              {rx.doctor?.specialty ? ` · ${rx.doctor.specialty}` : ''}
            </p>

            <div style={{ margin: '1rem 0', fontSize: '0.9rem' }}>
              {rx.diagnosis && <div><strong>Diagnosis:</strong> {rx.diagnosis}</div>}
              {rx.symptoms && <div><strong>Symptoms:</strong> {rx.symptoms}</div>}
              {rx.tests && <div><strong>Tests:</strong> {rx.tests}</div>}
            </div>

            <ul className="rx-meds">
              {rx.medicines.map((m, i) => (
                <li key={i}>
                  <span className="rx-med-name">{m.name}</span>
                  <span className="rx-med-detail">{m.dosage} · ×{m.qty} {m.unit}</span>
                </li>
              ))}
            </ul>

            {rx.notes && <p className="rx-notes">{rx.notes}</p>}
            <p className="share-footer">Read-only shared prescription · verify authenticity with UniCare Medical Center.</p>
          </>
        )}
      </div>
    </div>
  )
}
