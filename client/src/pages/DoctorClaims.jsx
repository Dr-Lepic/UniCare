import { useEffect, useState } from 'react'
import {
  Receipt,
  ClipboardCheck,
  Clock,
  History,
  FileText,
  X,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react'
import api from '../api'

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
const backendUrl = 'http://localhost:5000'

export default function DoctorClaims() {
  const [claims, setClaims]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('pending') // 'pending' or 'history'
  
  // Review state
  const [reviewingClaimId, setReviewingClaimId] = useState(null)
  const [reviewNotes, setReviewNotes]           = useState('')
  const [submitting, setSubmitting]             = useState(false)
  const [error, setError]                       = useState('')
  const [success, setSuccess]                   = useState('')

  const loadClaims = async () => {
    try {
      const { data } = await api.get('/reimbursements/mine')
      setClaims(data)
    } catch (err) {
      console.error('Failed to fetch claims', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClaims()
  }, [])

  const handleReview = async (claimId, status) => {
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      await api.patch(`/reimbursements/${claimId}/review`, {
        status,
        reviewNotes: reviewNotes.trim()
      })
      setSuccess(`Claim ${status} successfully!`)
      setReviewingClaimId(null)
      setReviewNotes('')
      loadClaims()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update claim review.')
    } finally {
      setSubmitting(false)
    }
  }

  const pendingClaims = claims.filter(c => c.status === 'pending')
  const historyClaims = claims.filter(c => c.status !== 'pending')
  const displayClaims = activeTab === 'pending' ? pendingClaims : historyClaims

  const getStatusClass = (status) => {
    if (status === 'approved') return 'status-pill--completed'
    if (status === 'rejected') return 'status-pill--cancelled'
    return 'status-pill--pending'
  }

  return (
    <div className="dashboard">
      {/* Top Banner */}
      <div className="dash-hero" style={{ padding: '2rem 1.5rem', marginBottom: '1.5rem' }}>
        <div>
          <p className="dash-greeting" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Receipt size={16} style={{ color: 'var(--accent)' }} /> Reimbursement Claims
          </p>
          <h2 className="dash-name" style={{ fontSize: 'var(--fs-xl)', margin: '0.2rem 0' }}>Review Queue</h2>
          <span className="dash-badge">
            {pendingClaims.length} Claim{pendingClaims.length !== 1 ? 's' : ''} require your action
          </span>
        </div>
        <div className="dash-hero-glyph">
          <ClipboardCheck size={48} />
        </div>
      </div>

      {success && (
        <div className="alert" style={{ borderColor: '#a7f3d0', borderLeftColor: '#059669', background: '#ecfdf5', color: '#047857', marginBottom: '1.5rem' }}>
          {success}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          className="slot-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: activeTab === 'pending' ? 'var(--accent-weak)' : 'var(--bg)',
            borderColor: activeTab === 'pending' ? 'var(--accent)' : 'var(--border-strong)',
            color: activeTab === 'pending' ? 'var(--accent)' : 'var(--text-sub)',
            fontWeight: '600',
            borderRadius: 'var(--r-md)'
          }}
          onClick={() => { setActiveTab('pending'); setReviewingClaimId(null); }}
        >
          <Clock size={15} /> Pending Review ({pendingClaims.length})
        </button>
        <button
          className="slot-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: activeTab === 'history' ? 'var(--accent-weak)' : 'var(--bg)',
            borderColor: activeTab === 'history' ? 'var(--accent)' : 'var(--border-strong)',
            color: activeTab === 'history' ? 'var(--accent)' : 'var(--text-sub)',
            fontWeight: '600',
            borderRadius: 'var(--r-md)'
          }}
          onClick={() => { setActiveTab('history'); setReviewingClaimId(null); }}
        >
          <History size={15} /> Review History ({historyClaims.length})
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: reviewingClaimId ? '1fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main List */}
        <div className="dash-section" style={{ margin: 0 }}>
          <p className="dash-section-title">
            {activeTab === 'pending' ? 'Pending Reimbursement Claims' : 'Processed Claims History'}
          </p>

          {loading ? (
            <p className="activity-empty">Loading claims queue…</p>
          ) : displayClaims.length === 0 ? (
            <p className="activity-empty">No claims to display.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {displayClaims.map(c => (
                <div
                  key={c._id}
                  className="appt-row"
                  style={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: '0.5rem',
                    padding: '1rem',
                    border: reviewingClaimId === c._id ? '2px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--bg)',
                    cursor: activeTab === 'pending' ? 'pointer' : 'default',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => {
                    if (activeTab === 'pending') {
                      setReviewingClaimId(c._id)
                      setReviewNotes(c.reviewNotes || '')
                      setError('')
                      setSuccess('')
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: 'var(--fs-md)' }}>{c.student?.name}</strong>
                      <span className="stat-label" style={{ marginLeft: '0.5rem', textTransform: 'uppercase', fontSize: '10px' }}>
                        {c.student?.studentId} · {c.student?.department}
                      </span>
                      <div className="stat-label" style={{ marginTop: '0.1rem' }}>
                        Submitted {fmtDate(c.createdAt)} · Hospital: {c.hospitalName}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <strong style={{ fontSize: 'var(--fs-md)' }}>{c.amount} BDT</strong>
                      <span className={`status-pill ${getStatusClass(c.status)}`}>{c.status}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                    <a
                      href={`${backendUrl}${c.billFileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="slot-btn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.6rem', fontSize: 'var(--fs-xs)', textDecoration: 'none' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <FileText size={14} /> View Uploaded Bill
                    </a>
                    {c.prescription && (
                      <span className="stat-label" style={{ fontSize: 'var(--fs-xs)' }}>
                        Prescription Date: {fmtDate(c.prescription.createdAt)}
                      </span>
                    )}
                  </div>

                  {c.status !== 'pending' && c.reviewNotes && (
                    <div style={{ background: 'var(--surface)', padding: '0.6rem 0.8rem', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)', marginTop: '0.25rem' }}>
                      <strong>Feedback Notes: </strong>
                      <span style={{ color: 'var(--text-sub)' }}>{c.reviewNotes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Form Drawer/Sidebar (only opens when claim selected for review) */}
        {reviewingClaimId && activeTab === 'pending' && (
          (() => {
            const reviewingClaim = claims.find(c => c._id === reviewingClaimId)
            if (!reviewingClaim) return null
            return (
              <div className="dash-section" style={{ margin: 0, position: 'sticky', top: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <p className="dash-section-title" style={{ margin: 0 }}>Reviewing Claim</p>
                  <button
                    className="slot-btn"
                    style={{ padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: 'var(--fs-xs)' }}
                    onClick={() => setReviewingClaimId(null)}
                    aria-label="Close review panel"
                  >
                    Close <X size={14} />
                  </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                  <span className="role-info-label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.2rem' }}>STUDENT</span>
                  <strong>{reviewingClaim.student?.name}</strong>
                  <p className="stat-label" style={{ margin: '0.1rem 0 0.75rem 0' }}>ID: {reviewingClaim.student?.studentId} · Dept: {reviewingClaim.student?.department}</p>
                  
                  <span className="role-info-label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.2rem' }}>CLAIM DETAILS</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="stat-label" style={{ margin: 0 }}>Amount:</span>
                    <strong>{reviewingClaim.amount} BDT</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="stat-label" style={{ margin: 0 }}>Hospital:</span>
                    <strong>{reviewingClaim.hospitalName}</strong>
                  </div>
                  
                  <a
                    href={`${backendUrl}${reviewingClaim.billFileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-submit"
                    style={{ background: 'var(--bg)', color: 'var(--text-sub)', borderColor: 'var(--border-strong)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.75rem', fontSize: 'var(--fs-sm)' }}
                  >
                    <FileText size={15} /> View Uploaded Bill File <ExternalLink size={13} />
                  </a>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Review Decision Notes (Feedback)</label>
                  <textarea
                    id="notes"
                    rows="4"
                    placeholder="Enter approval details, rejection reasons, or other feedback for the student..."
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    className="btn-submit"
                    style={{ background: '#0d9488', borderColor: '#0d9488', flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    disabled={submitting}
                    onClick={() => handleReview(reviewingClaimId, 'approved')}
                  >
                    {submitting ? 'Processing…' : (
                      <>
                        <CheckCircle2 size={16} /> Approve Claim
                      </>
                    )}
                  </button>
                  <button
                    className="btn-submit"
                    style={{ background: '#b91c1c', borderColor: '#b91c1c', flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    disabled={submitting}
                    onClick={() => handleReview(reviewingClaimId, 'rejected')}
                  >
                    {submitting ? 'Processing…' : (
                      <>
                        <XCircle size={16} /> Reject Claim
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })()
        )}
      </div>
    </div>
  )
}
