import { useState } from 'react'
import { Lock, X, Eye, EyeOff } from 'lucide-react'
import api from '../api'

const PasswordInput = (props) => {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input {...props} type={show ? 'text' : 'password'} style={{ ...props.style, paddingRight: '2.5rem' }} />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const validate = () => {
    if (!oldPassword || !newPassword || !confirmPassword) return 'All fields are required.'
    if (newPassword !== confirmPassword) return 'New password and confirm password do not match.'
    if (newPassword.length < 6) return 'New password must be at least 6 characters long.'
    if (!/[A-Z]/.test(newPassword)) return 'New password must include at least one uppercase letter.'
    if (!/[a-z]/.test(newPassword)) return 'New password must include at least one lowercase letter.'
    if (!/[0-9]/.test(newPassword)) return 'New password must include at least one number.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const valErr = validate()
    if (valErr) return setError(valErr)

    setSubmitting(true)
    try {
      const { data } = await api.put('/auth/change-password', { oldPassword, newPassword })
      setSuccess(data.message || 'Password changed successfully!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: 'var(--fs-md)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Lock size={18} style={{ color: 'var(--accent)' }} /> Change Password
          </h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="alert" style={{ borderColor: '#a7f3d0', borderLeftColor: '#059669', background: '#ecfdf5', color: '#047857', marginBottom: '1rem' }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="oldPassword">Previous Password</label>
            <PasswordInput
              id="oldPassword"
              placeholder="••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <PasswordInput
              id="newPassword"
              placeholder="Min 6 chars (A-z, 0-9)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <PasswordInput
              id="confirmPassword"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="slot-btn"
              onClick={onClose}
              style={{ flex: 1, justifyContent: 'center', padding: '.625rem', border: '1px solid var(--border-strong)', background: 'transparent' }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit" style={{ flex: 1 }} disabled={submitting}>
              {submitting ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
