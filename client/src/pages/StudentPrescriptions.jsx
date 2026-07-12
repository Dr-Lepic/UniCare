import { useEffect, useState } from 'react'
import api from '../api'

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

function ShareBox({ prescription }) {
  const [token, setToken]     = useState(prescription.shareToken || '')
  const [expires, setExpires] = useState(prescription.shareTokenExpiresAt || '')
  const [busy, setBusy]       = useState(false)
  const [copied, setCopied]   = useState(false)

  const url = token ? `${window.location.origin}/rx/${token}` : ''
  const active = expires && new Date(expires) > new Date()

  const generate = async () => {
    setBusy(true)
    try {
      const { data } = await api.post(`/prescriptions/${prescription._id}/share`)
      setToken(data.token)
      setExpires(data.expiresAt)
    } finally {
      setBusy(false)
    }
  }

  const copy = () => {
    navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rx-share">
      {active ? (
        <>
          <div className="rx-share-row">
            <input readOnly value={url} onFocus={e => e.target.select()} />
            <button className="slot-btn" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
          </div>
          <p className="rx-share-note">Anyone with this link can view the prescription until {fmtDate(expires)}. <button className="link-btn" onClick={generate} disabled={busy}>Regenerate</button></p>
        </>
      ) : (
        <button className="slot-btn" onClick={generate} disabled={busy}>
          {busy ? 'Generating…' : '🔗 Generate shareable link'}
        </button>
      )}
    </div>
  )
}

export default function StudentPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    api.get('/prescriptions/mine')
      .then(r => setPrescriptions(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="dashboard">
      <div className="dash-section">
        <p className="dash-section-title">My Prescriptions</p>
        {loading ? (
          <p className="activity-empty">Loading…</p>
        ) : prescriptions.length === 0 ? (
          <p className="activity-empty">No prescriptions yet.</p>
        ) : (
          <div className="rx-list">
            {prescriptions.map(p => (
              <div key={p._id} className="rx-card">
                <div className="rx-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong>Dr. {p.doctor?.name}</strong>
                      {p.status === 'dispensed' ? (
                        <span className="status-pill status-pill--completed">Dispensed</span>
                      ) : (
                        <span className="status-pill status-pill--pending">Pending Collection</span>
                      )}
                    </div>
                    <span className="stat-label">{p.doctor?.specialty || 'General'}</span>
                  </div>
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
                {p.status !== 'dispensed' && p.otpCode && (
                  <div style={{
                    margin: '1rem 0',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--r-sm)',
                    border: '1px dashed var(--border-strong)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span className="role-info-label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.1rem' }}>COLLECTION OTP CODE</span>
                      <strong style={{ fontSize: '1.25rem', letterSpacing: '0.05em', color: 'var(--accent)' }}>{p.otpCode}</strong>
                    </div>
                    {p.otpExpiresAt && (
                      <span className="stat-label" style={{ fontSize: '0.75rem' }}>
                        Expires: {fmtDate(p.otpExpiresAt)}
                      </span>
                    )}
                  </div>
                )}
                <ShareBox prescription={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
