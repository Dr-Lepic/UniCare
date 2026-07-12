import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Role configuration — expand nav arrays in future milestones
const ROLE_CONFIG = {
  student: {
    label:  'Student',
    icon:   '🎓',
    color:  '#3b82f6',
    bgColor:'rgba(59,130,246,.15)',
    nav: [
      { to: 'dashboard', icon: '📊', label: 'Dashboard' },
      { to: 'appointments', icon: '📅', label: 'Appointments' },
      { to: 'prescriptions', icon: '📋', label: 'Prescriptions' },
      { icon: '💰', label: 'Reimbursements',coming: 'M6' },
    ],
  },
  doctor: {
    label:  'Doctor',
    icon:   '👨‍⚕️',
    color:  '#0d9488',
    bgColor:'rgba(13,148,136,.15)',
    nav: [
      { to: 'dashboard', icon: '📊', label: 'Dashboard' },
      { to: 'appointments', icon: '📅', label: 'Appointment Queue' },
      { to: 'prescriptions', icon: '✍️', label: 'Prescriptions' },
      { icon: '💰', label: 'Review Claims',    coming: 'M6' },
    ],
  },
  pharmacist: {
    label:  'Pharmacist',
    icon:   '💊',
    color:  '#7c3aed',
    bgColor:'rgba(124,58,237,.15)',
    nav: [
      { to: 'dashboard', icon: '📊', label: 'Dashboard' },
      { icon: '🔑', label: 'Verify OTP',    coming: 'M5' },
      { icon: '📦', label: 'Inventory',     coming: 'M7' },
      { icon: '🔄', label: 'Restock Log',   coming: 'M7' },
    ],
  },
  admin: {
    label:  'Admin',
    icon:   '⚙️',
    color:  '#d97706',
    bgColor:'rgba(217,119,6,.15)',
    nav: [
      { to: 'dashboard', icon: '📊', label: 'Dashboard' },
      { icon: '👥', label: 'Manage Users', coming: 'M8' },
      { icon: '📈', label: 'System Logs',  coming: 'M8' },
    ],
  },
}

export default function PanelLayout() {
  const { role }     = useParams()
  const { user, logout } = useAuth()
  const navigate     = useNavigate()
  const cfg          = ROLE_CONFIG[role] ?? ROLE_CONFIG.student

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div
      className="panel"
      style={{ '--accent': cfg.color, '--accent-weak': cfg.bgColor, '--accent-strong': cfg.color, '--focus': cfg.bgColor }}
    >
      {/* ── Sidebar ── */}
      <aside className="sidebar">

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏥</div>
          <span>UniCare</span>
        </div>

        {/* Role card */}
        <div className="sidebar-role-card">
          <div className="role-avatar">{cfg.icon}</div>
          <div style={{ overflow: 'hidden' }}>
            <p className="role-info-label">{cfg.label}</p>
            <p className="role-info-name">{user?.name ?? '—'}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Menu</span>

          {cfg.nav.map((item, i) =>
            item.to ? (
              <NavLink
                key={i}
                to={`/panel/${role}/${item.to}`}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-link-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ) : (
              <button key={i} className="nav-link" style={{ cursor: 'not-allowed', width: '100%', border: 'none', background: 'none', textAlign: 'left' }}>
                <span className="nav-link-icon">{item.icon}</span>
                {item.label}
                <span className="nav-link-coming">{item.coming}</span>
              </button>
            )
          )}
        </nav>

        {/* Logout */}
        <button className="sidebar-logout" onClick={handleLogout}>
          🚪 Sign Out
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className="panel-main">
        <Outlet />
      </main>
    </div>
  )
}
