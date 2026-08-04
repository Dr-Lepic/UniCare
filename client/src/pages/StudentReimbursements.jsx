import { useEffect, useState } from 'react'
import api from '../api'

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
const backendUrl = 'http://localhost:5001'

export default function StudentReimbursements() {
  const [prescriptions, setPrescriptions] = useState([])
  const [claims, setClaims]               = useState([])
  const [loading, setLoading]             = useState(true)

  // Form State
  const [prescriptionId, setPrescriptionId] = useState('')
  const [amount, setAmount]                 = useState('')
  const [hospitalName, setHospitalName]     = useState('')
  const [file, setFile]                     = useState(null)
  const [submitError, setSubmitError]       = useState('')
  const [submitSuccess, setSubmitSuccess]   = useState('')
  const [submitting, setSubmitting]         = useState(false)

  const loadData = async () => {
    try {
      const [rxRes, claimsRes] = await Promise.all([
        api.get('/prescriptions/mine'),
        api.get('/reimbursements/mine')
      ])
      setPrescriptions(rxRes.data)
      setClaims(claimsRes.data)
    } catch (err) {
      console.error('Failed to load data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const selectedPrescription = prescriptions.find(p => p._id === prescriptionId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')

    if (!prescriptionId) {
      return setSubmitError('Please select a prescription.')
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return setSubmitError('Please enter a valid positive amount.')
    }
    if (!hospitalName.trim()) {
      return setSubmitError('Please enter the hospital name.')
    }
    if (!file) {
      return setSubmitError('Please upload a copy of the bill (Image or PDF).')
    }

    setSubmitting(true)
    const formData = new FormData()
    formData.append('prescriptionId', prescriptionId)
    formData.append('amount', amount)
    formData.append('hospitalName', hospitalName)
    formData.append('bill', file)

    try {
      await api.post('/reimbursements', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      setSubmitSuccess('Reimbursement claim submitted successfully!')
      // Reset form
      setPrescriptionId('')
      setAmount('')
      setHospitalName('')
      setFile(null)
      // Reset file input element
      e.target.reset()
      // Reload lists
      loadData()
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit claim. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Count pending claims for display header
  const pendingCount = claims.filter(c => c.status === 'pending').length

  const getStatusClass = (status) => {
    if (status === 'approved') return 'status-pill--completed'
    if (status === 'rejected') return 'status-pill--cancelled'
    return 'status-pill--pending'
  }

  return (
    <div className="dashboard">
      {/* Top Banner with Stats */}
      <div className="dash-hero" style={{ padding: '2rem 1.5rem', marginBottom: '1.5rem' }}>
        <div>
          <p className="dash-greeting">💰 Reimbursements Portal</p>
          <h2 className="dash-name" style={{ fontSize: 'var(--fs-xl)', margin: '0.2rem 0' }}>Track & Submit Claims</h2>
          <span className="dash-badge">
            {pendingCount} Pending Claim{pendingCount !== 1 ? 's' : ''} under review
          </span>
        </div>
        <div className="dash-hero-glyph">💰</div>
      </div>

      <div className="dash-bottom" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 2fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Form panel */}
        <div className="dash-section">
          <p className="dash-section-title">New Reimbursement Claim</p>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            {submitError && <div className="alert alert-error">{submitError}</div>}
            {submitSuccess && <div className="alert" style={{ borderColor: '#a7f3d0', borderLeftColor: '#059669', background: '#ecfdf5', color: '#047857' }}>{submitSuccess}</div>}

            <div className="form-group">
              <label htmlFor="prescription">Select Prescription</label>
              <select
                id="prescription"
                value={prescriptionId}
                onChange={e => setPrescriptionId(e.target.value)}
                required
              >
                <option value="">-- Choose Prescription --</option>
                {prescriptions.map(p => {
                  const hasTests = Boolean(p.tests && p.tests.trim())
                  return (
                    <option key={p._id} value={p._id}>
                      {fmtDate(p.createdAt)} — Dr. {p.doctor?.name} {hasTests ? `🧪 [Tests: ${p.tests}]` : `❌ [No Tests - Ineligible]`}
                    </option>
                  )
                })}
              </select>
            </div>

            {selectedPrescription && (
              <div className="form-group" style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginBottom: '1.1rem' }}>
                <span className="role-info-label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.2rem' }}>ASSIGNED VERIFIER DOCTOR</span>
                <strong>Dr. {selectedPrescription.doctor?.name}</strong>
                <p className="stat-label" style={{ margin: 0 }}>{selectedPrescription.doctor?.specialty || 'General Physician'}</p>
                
                {selectedPrescription.tests && selectedPrescription.tests.trim() ? (
                  <div style={{ marginTop: '0.5rem', color: '#059669', fontSize: '0.85rem' }}>
                    🧪 <strong>Recommended Tests:</strong> {selectedPrescription.tests}
                  </div>
                ) : (
                  <div style={{ marginTop: '0.5rem', color: '#dc2626', fontSize: '0.85rem', fontWeight: 500 }}>
                    ⚠️ No recommended lab tests on this prescription. Ineligible for reimbursement claim.
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="hospital">Hospital/Clinic Name</label>
              <input
                id="hospital"
                type="text"
                placeholder="e.g. Square Hospital"
                value={hospitalName}
                onChange={e => setHospitalName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount">Reimbursement Amount (BDT)</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="bill">Upload Bill Copy (PDF, PNG, JPG)</label>
              <input
                id="bill"
                type="file"
                accept="application/pdf,image/*"
                onChange={e => setFile(e.target.files[0])}
                required
                style={{ padding: '0.4rem 0' }}
              />
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={submitting || (selectedPrescription && (!selectedPrescription.tests || !selectedPrescription.tests.trim()))}
            >
              {submitting ? 'Submitting…' : 'Submit Claim'}
            </button>
          </form>
        </div>

        {/* List panel */}
        <div className="dash-section">
          <p className="dash-section-title">My Claims History</p>
          {loading ? (
            <p className="activity-empty">Loading claims…</p>
          ) : claims.length === 0 ? (
            <p className="activity-empty">No reimbursement claims submitted yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {claims.map(c => (
                <div key={c._id} className="appt-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: 'var(--fs-md)' }}>{c.hospitalName}</strong>
                      <div className="stat-label" style={{ marginTop: '0.1rem' }}>
                        Submitted on {fmtDate(c.createdAt)} · Assisting Doctor: Dr. {c.doctor?.name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <strong style={{ color: 'var(--text)' }}>{c.amount} BDT</strong>
                      <span className={`status-pill ${getStatusClass(c.status)}`}>{c.status}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                    <a
                      href={`${backendUrl}${c.billFileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="slot-btn"
                      style={{ padding: '0.3rem 0.6rem', fontSize: 'var(--fs-xs)', textDecoration: 'none' }}
                    >
                      📄 View Uploaded Bill
                    </a>
                    {c.prescription && (
                      <span className="stat-label" style={{ fontSize: 'var(--fs-xs)' }}>
                        Prescription: {fmtDate(c.prescription.createdAt)}
                      </span>
                    )}
                  </div>

                  {c.status !== 'pending' && (
                    <div style={{ background: 'var(--surface)', padding: '0.6rem 0.8rem', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)', marginTop: '0.25rem' }}>
                      <strong>Reviewer Feedback: </strong>
                      <span style={{ color: 'var(--text-sub)' }}>{c.reviewNotes || 'No notes provided.'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
