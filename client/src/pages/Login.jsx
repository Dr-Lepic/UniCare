import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  HeartPulse,
  Calendar,
  Pill,
  Share2,
  Receipt,
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  Send,
  KeyRound
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
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

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [loading, setLoading]   = useState(false)
  const { user, login }         = useAuth()
  const navigate                = useNavigate()

  // Forgot password states
  const [forgotPassMode, setForgotPassMode] = useState(false)
  const [fpStep, setFpStep] = useState('email') // email -> otp -> reset
  const [fpEmail, setFpEmail] = useState('')
  const [fpOtp, setFpOtp] = useState('')
  const [fpNewPassword, setFpNewPassword] = useState('')
  const [fpConfirmPassword, setFpConfirmPassword] = useState('')

  // Already logged in → redirect immediately
  if (user) return <Navigate to={`/panel/${user.role}/dashboard`} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const u = await login(email, password)
      navigate(`/panel/${u.role}/dashboard`, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email: fpEmail })
      setSuccess(data.message)
      setFpStep('reset')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('');
    
    if (fpNewPassword !== fpConfirmPassword) {
      return setError('Passwords do not match.')
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/reset-password', {
        email: fpEmail,
        otp: fpOtp,
        newPassword: fpNewPassword
      })
      setSuccess(data.message)
      setTimeout(() => {
        setForgotPassMode(false)
        setFpStep('email')
        setFpEmail('')
        setFpOtp('')
        setFpNewPassword('')
        setFpConfirmPassword('')
        setSuccess('')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: Calendar, text: 'Book appointments with campus doctors' },
    { icon: Pill, text: 'E-prescriptions & medicine dispensing' },
    { icon: Share2, text: 'Shareable prescription links' },
    { icon: Receipt, text: 'Reimbursement claim tracking' },
  ]

  return (
    <div className="login-page">

      {/* ── Left brand panel ── */}
      <div className="login-left">
        <div className="brand-mark">
          <div className="brand-mark-icon">
            <HeartPulse size={26} />
          </div>
          <div>
            <h1>UniCare</h1>
            <p>University Medical Center</p>
          </div>
        </div>

        <p className="login-tagline">
          Healthcare made simple<br />
          for <span>every student</span>.
        </p>

        <ul className="login-features">
          {features.map(({ icon: Icon, text }) => (
            <li key={text}>
              <span className="feat-dot">
                <Icon size={16} />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {forgotPassMode ? (
                <>
                  <Lock size={22} style={{ color: 'var(--accent)' }} /> Reset Password
                </>
              ) : (
                'Welcome back'
              )}
            </h2>
            <p>{forgotPassMode ? 'Follow the steps to reset your password' : 'Sign in to your UniCare portal'}</p>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          {success && <div className="alert" style={{ borderColor: '#a7f3d0', borderLeftColor: '#059669', background: '#ecfdf5', color: '#047857', marginBottom: '1rem' }}>{success}</div>}

          {!forgotPassMode ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@unicare.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  Password
                  <button type="button" className="link-btn" style={{ fontWeight: 'normal' }} onClick={() => setForgotPassMode(true)}>
                    Forgot password?
                  </button>
                </label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Signing in…' : (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            fpStep === 'email' ? (
              <form onSubmit={handleSendOtp}>
                <div className="form-group">
                  <label htmlFor="fpEmail">Enter your email</label>
                  <input
                    id="fpEmail"
                    type="email"
                    placeholder="you@unicare.edu"
                    value={fpEmail}
                    onChange={e => setFpEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Sending OTP…' : (
                    <>
                      <Send size={16} /> Send OTP
                    </>
                  )}
                </button>
                <button type="button" className="link-btn" style={{ display: 'block', margin: '1rem auto 0', fontWeight: 'normal' }} onClick={() => setForgotPassMode(false)}>
                  Back to login
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label htmlFor="fpOtp">Enter OTP (sent to {fpEmail})</label>
                  <input
                    id="fpOtp"
                    type="text"
                    placeholder="6-digit code"
                    value={fpOtp}
                    onChange={e => setFpOtp(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="fpNewPassword">New Password</label>
                  <PasswordInput
                    id="fpNewPassword"
                    placeholder="Min 6 chars (A-z, 0-9)"
                    value={fpNewPassword}
                    onChange={e => setFpNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="fpConfirmPassword">Confirm Password</label>
                  <PasswordInput
                    id="fpConfirmPassword"
                    placeholder="Re-enter new password"
                    value={fpConfirmPassword}
                    onChange={e => setFpConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Resetting…' : (
                    <>
                      <KeyRound size={16} /> Reset Password
                    </>
                  )}
                </button>
                <button type="button" className="link-btn" style={{ display: 'block', margin: '1rem auto 0', fontWeight: 'normal' }} onClick={() => { setFpStep('email'); setError(''); setSuccess('') }}>
                  Back to email step
                </button>
              </form>
            )
          )}

          {!forgotPassMode && (
            <p className="login-hint">
              
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
