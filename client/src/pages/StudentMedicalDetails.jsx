import { useEffect, useState } from 'react'
import api from '../api'

export default function StudentMedicalDetails() {
  const [medicalDetails, setMedicalDetails] = useState('')
  const [loading, setLoading]               = useState(true)
  const [saving, setSaving]                 = useState(false)
  const [error, setError]                   = useState('')
  const [success, setSuccess]               = useState('')

  useEffect(() => {
    api.get('/students/medical-details')
      .then(res => {
        setMedicalDetails(res.data.medicalDetails || '')
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load medical details.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const res = await api.put('/students/medical-details', { medicalDetails })
      setMedicalDetails(res.data.medicalDetails || '')
      setSuccess('Medical details saved successfully! Stored securely in database.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save medical details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard">
      <div className="dash-hero" style={{ padding: '2rem 1.5rem', marginBottom: '1.5rem' }}>
        <div>
          <p className="dash-greeting">🩺 Student Health Record</p>
          <h2 className="dash-name" style={{ fontSize: 'var(--fs-xl)', margin: '0.2rem 0' }}>Medical Profile & Allergies</h2>
          <span className="dash-badge">
            🔒 Base64 Encoded in DB · Confidential (Doctor & You Only)
          </span>
        </div>
        <div className="dash-hero-glyph">🩺</div>
      </div>

      <div className="dash-section" style={{ maxWidth: '800px' }}>
        <p className="dash-section-title">My Medical History & Details</p>

        {loading ? (
          <p className="activity-empty">Loading health details…</p>
        ) : (
          <form onSubmit={handleSave}>
            {error && <div className="alert alert-error">{error}</div>}
            {success && (
              <div className="alert" style={{ borderColor: '#a7f3d0', borderLeftColor: '#059669', background: '#ecfdf5', color: '#047857' }}>
                {success}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="medicalDetails">
                Allergies, Pre-existing Conditions, & Medical Notes
              </label>
              <textarea
                id="medicalDetails"
                rows="8"
                placeholder="E.g., Allergic to Penicillin, Asthmatic, Blood Group A+, taking daily multivitamins..."
                value={medicalDetails}
                onChange={e => setMedicalDetails(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit' }}
              />
              <span className="stat-label" style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                ℹ️ Note: These details are saved in the system in encoded format. Your attending doctor will see these details while writing your prescription for safety checks, but they will not be printed on your prescription document.
              </span>
            </div>

            <button type="submit" className="btn-submit" style={{ width: 'auto', marginTop: '1rem' }} disabled={saving}>
              {saving ? 'Saving…' : 'Save Medical Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
