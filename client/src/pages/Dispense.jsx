import { useState } from 'react'
import api from '../api'

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

export default function Dispense() {
  const [code, setCode]               = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)
  const [prescription, setPrescription] = useState(null)
  const [otpExpiresAt, setOtpExpiresAt] = useState(null)
  const [dispenseLoading, setDispenseLoading] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.')
      return
    }

    setLoading(true)
    setError('')
    setPrescription(null)
    setSuccess(false)

    try {
      const { data } = await api.post('/prescriptions/otp/verify', { code })
      setPrescription(data.prescription)
      setOtpExpiresAt(data.expiresAt)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP. Please check the code.')
    } finally {
      setLoading(false)
    }
  }

  const handleDispense = async () => {
    if (!prescription) return

    setDispenseLoading(true)
    setError('')

    try {
      await api.post('/prescriptions/otp/dispense', { code })
      setSuccess(true)
      setPrescription(null)
      setCode('')
    } catch (err) {
      setError(err.response?.data?.message || 'Dispensing failed. Please try again.')
    } finally {
      setDispenseLoading(false)
    }
  }

  const handleReset = () => {
    setCode('')
    setError('')
    setSuccess(false)
    setPrescription(null)
  }

  // Check if any medicine has insufficient stock
  const hasStockIssues = prescription?.medicines.some(
    (m) => !m.medicine || m.medicine.stockQty < m.qty
  )

  return (
    <div className="dashboard">
      <div className="dash-section">
        <p className="dash-section-title">Verify OTP & Dispense Medicine</p>

        {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        {success && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3>Medicines Dispensed Successfully!</h3>
            <p className="role-info-name" style={{ margin: '0.5rem 0 1.5rem' }}>
              The stock levels have been decremented and the OTP marked as used.
            </p>
            <button className="btn-submit" onClick={handleReset} style={{ maxWidth: '240px', margin: '0 auto' }}>
              Verify Another OTP
            </button>
          </div>
        )}

        {!success && !prescription && (
          <form onSubmit={handleVerify} style={{ maxWidth: '400px', marginTop: '1rem' }}>
            <div className="form-group">
              <label htmlFor="otp-code">6-Digit Collection OTP</label>
              <input
                id="otp-code"
                type="text"
                maxLength={6}
                placeholder="e.g. 123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                style={{ fontSize: '1.25rem', letterSpacing: '0.2em', textAlign: 'center', fontWeight: 'bold' }}
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-submit" disabled={loading || code.length !== 6}>
              {loading ? 'Verifying OTP…' : 'Verify OTP →'}
            </button>
          </form>
        )}

        {!success && prescription && (
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Patient & Doctor Header Info */}
            <div className="rx-card" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div className="rx-card-head" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <div>
                  <span className="role-info-label" style={{ fontSize: '0.75rem' }}>PATIENT</span>
                  <h3 style={{ margin: '0.1rem 0' }}>{prescription.student?.name}</h3>
                  <span className="stat-label">ID: {prescription.student?.studentId} · Dept: {prescription.student?.department}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="role-info-label" style={{ fontSize: '0.75rem' }}>PRESCRIBED BY</span>
                  <p style={{ margin: '0.1rem 0', fontWeight: '600' }}>Dr. {prescription.doctor?.name}</p>
                  <span className="stat-label">{prescription.doctor?.specialty || 'General'}</span>
                </div>
              </div>

              {/* Medicines List */}
              <div style={{ marginBottom: '1.2rem' }}>
                <span className="role-info-label" style={{ display: 'block', marginBottom: '0.5rem' }}>PRESCRIBED MEDICINES</span>
                <ul className="rx-meds" style={{ paddingLeft: '0' }}>
                  {prescription.medicines.map((m, i) => {
                    const isOutOfStock = !m.medicine || m.medicine.stockQty < m.qty
                    return (
                      <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--surface-2)' }}>
                        <div>
                          <span className="rx-med-name" style={{ fontWeight: '600', display: 'block' }}>{m.medicine?.name || 'Unknown'}</span>
                          <span className="rx-med-detail" style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>{m.dosage}</span>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                          <span style={{ fontWeight: '600' }}>Qty: {m.qty} {m.medicine?.unit || 'unit'}</span>
                          <span style={{ fontSize: '0.8rem', color: isOutOfStock ? '#b91c1c' : '#047857', fontWeight: '500' }}>
                            {isOutOfStock ? `⚠️ Insufficient stock (${m.medicine?.stockQty || 0} left)` : `✓ In stock (${m.medicine?.stockQty || 0} left)`}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {prescription.notes && (
                <div style={{ marginBottom: '1.2rem', background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
                  <span className="role-info-label" style={{ display: 'block', marginBottom: '0.2rem' }}>NOTES</span>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--text-sub)' }}>{prescription.notes}</p>
                </div>
              )}

              {otpExpiresAt && (
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
                  OTP Code <strong>{code}</strong> is valid until: {fmtDate(otpExpiresAt)}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="slot-btn" onClick={handleReset} disabled={dispenseLoading} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  className="btn-submit"
                  onClick={handleDispense}
                  disabled={dispenseLoading || hasStockIssues}
                  style={{ flex: 2, margin: '0' }}
                >
                  {dispenseLoading ? 'Dispensing...' : 'Confirm Dispense & Decrement Stock'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
