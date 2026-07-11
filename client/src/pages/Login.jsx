import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { user, login }         = useAuth()
  const navigate                = useNavigate()

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

  return (
    <div className="login-page">

      {/* ── Left brand panel ── */}
      <div className="login-left">
        <div className="brand-mark">
          <div className="brand-mark-icon">🏥</div>
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
          {[
            ['📅', 'Book appointments with campus doctors'],
            ['💊', 'E-prescriptions & medicine dispensing'],
            ['🔗', 'Shareable prescription links'],
            ['💰', 'Reimbursement claim tracking'],
          ].map(([icon, text]) => (
            <li key={text}>
              <span className="feat-dot">{icon}</span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2>Welcome back 👋</h2>
            <p>Sign in to your UniCare portal</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

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
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p className="login-hint">
            Demo accounts · <strong>doctor@unicare.edu / doc123</strong><br />
            student@unicare.edu / student123
          </p>
        </div>
      </div>
    </div>
  )
}
