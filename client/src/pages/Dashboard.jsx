import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Role-specific dashboard content — placeholder data for M1 shells
const ROLE_DATA = {
  student: {
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
    accent:   '#3b82f6',
    stats: [
      { icon: '🏥', value: 3,  label: 'Total Visits' },
      { icon: '📅', value: 2,  label: 'Upcoming Appointments' },
      { icon: '💊', value: 1,  label: 'Active Prescriptions' },
      { icon: '💰', value: 0,  label: 'Pending Claims' },
    ],
    actions: [
      { icon: '📅', label: 'Book Appointment',   to: 'appointments' },
      { icon: '📋', label: 'View Prescriptions',  tag: 'M3' },
      { icon: '🔗', label: 'Share Sick Leave',    tag: 'M4' },
      { icon: '💰', label: 'Submit Claim',        tag: 'M6' },
    ],
    activity: [
      'Appointment confirmed — Dr. Mahbub, Jul 5',
      'Prescription #PRX-001 issued — Jul 1',
      'Reimbursement claim submitted — Jun 28',
    ],
  },

  doctor: {
    gradient: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
    accent:   '#0d9488',
    stats: [
      { icon: '📅', value: 8,   label: "Today's Appointments" },
      { icon: '👥', value: 145, label: 'Total Patients' },
      { icon: '📋', value: 23,  label: 'Prescriptions Written' },
      { icon: '💰', value: 3,   label: 'Claims to Review' },
    ],
    actions: [
      { icon: '📋', label: 'View Appointment Queue', to: 'appointments' },
      { icon: '✍️', label: 'Write Prescription',     tag: 'M3' },
      { icon: '💰', label: 'Review Reimbursements',  tag: 'M6' },
    ],
    activity: [
      'Consulted Student #STU-036 — Jul 5, 10:30 AM',
      'Prescription #PRX-023 written for Paracetamol — Jul 4',
      'Reimbursement claim #RC-07 approved — Jul 3',
    ],
  },

  pharmacist: {
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
    accent:   '#7c3aed',
    stats: [
      { icon: '🔑', value: 5,  label: 'OTPs Pending' },
      { icon: '💊', value: 12, label: 'Dispensed Today' },
      { icon: '⚠️', value: 3,  label: 'Low Stock Items' },
      { icon: '🏪', value: 48, label: 'Total Medicines' },
    ],
    actions: [
      { icon: '🔑', label: 'Verify OTP',         tag: 'M5' },
      { icon: '📦', label: 'Check Inventory',    tag: 'M7' },
      { icon: '🔄', label: 'Log Restock Entry',  tag: 'M7' },
    ],
    activity: [
      'OTP verified — STU-036, Paracetamol ×10 — Jul 5',
      'Stock restocked: Amoxicillin +200 units — Jul 4',
      'Low-stock alert: Ibuprofen (8 left) — Jul 3',
    ],
  },

  admin: {
    gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
    accent:   '#d97706',
    stats: [
      { icon: '👥', value: 198, label: 'Total Users' },
      { icon: '👨‍⚕️', value: 12, label: 'Doctors' },
      { icon: '🎓', value: 184, label: 'Students' },
      { icon: '💊', value: 2,   label: 'Pharmacists' },
    ],
    actions: [
      { icon: '👥', label: 'Manage Users',       tag: 'M8' },
      { icon: '📈', label: 'View System Logs',   tag: 'M8' },
      { icon: '⚙️', label: 'Inventory Settings', tag: 'M7' },
    ],
    activity: [
      'New user registered: Dr. Sarah Hossain — Jul 6',
      'System backup completed — Jul 5, 03:00 AM',
      'Password reset: student@unicare.edu — Jul 4',
    ],
  },
}

export default function Dashboard() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const role       = user?.role || 'student'
  const data       = ROLE_DATA[role] ?? ROLE_DATA.student
  const firstName  = user?.name?.split(' ')[0] ?? 'User'

  return (
    <div className="dashboard">

      {/* Hero banner */}
      <div className="dash-hero">
        <div>
          <p className="dash-greeting">Good day, {firstName} 👋</p>
          <h2 className="dash-name">{user?.name}</h2>
          <span className="dash-badge">
            {role.charAt(0).toUpperCase() + role.slice(1)} Portal · UniCare
          </span>
        </div>
        <div className="dash-hero-glyph">🏥</div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {data.stats.map((s, i) => (
          <div key={i} className="stat-card">
            <span className="stat-icon">{s.icon}</span>
            <p className="stat-value">{s.value}</p>
            <p className="stat-label">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bottom: actions + activity */}
      <div className="dash-bottom">

        <div className="dash-section">
          <p className="dash-section-title">Quick Actions</p>
          <div className="actions-list">
            {data.actions.map((a, i) => (
              <button
                key={i}
                className="action-btn"
                title={a.to ? undefined : `Available in ${a.tag}`}
                disabled={!a.to}
                onClick={a.to ? () => navigate(`/panel/${role}/${a.to}`) : undefined}
              >
                <span className="action-icon">{a.icon}</span>
                <span>{a.label}</span>
                {a.tag && <span className="milestone-tag">{a.tag}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="dash-section">
          <p className="dash-section-title">Recent Activity</p>
          {data.activity.length ? (
            <ul className="activity-list">
              {data.activity.map((item, i) => (
                <li key={i} className="activity-item">
                  <span className="activity-dot" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="activity-empty">No recent activity.</p>
          )}
        </div>
      </div>

    </div>
  )
}
