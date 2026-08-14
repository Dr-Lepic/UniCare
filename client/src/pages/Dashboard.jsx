import { useNavigate } from 'react-router-dom'
import {
  Hospital,
  Calendar,
  Pill,
  Receipt,
  Share2,
  FileText,
  Users,
  PenSquare,
  KeyRound,
  AlertTriangle,
  Boxes,
  RotateCcw,
  Stethoscope,
  GraduationCap,
  Activity,
  Settings,
  HeartPulse
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Role-specific dashboard content
const ROLE_DATA = {
  student: {
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
    accent:   '#3b82f6',
    stats: [
      { icon: Hospital, value: 3,  label: 'Total Visits' },
      { icon: Calendar, value: 2,  label: 'Upcoming Appointments' },
      { icon: Pill, value: 1,  label: 'Active Prescriptions' },
      { icon: Receipt, value: 0,  label: 'Pending Claims' },
    ],
    actions: [
      { icon: Calendar, label: 'Book Appointment',   to: 'appointments' },
      { icon: FileText, label: 'View Prescriptions',  to: 'prescriptions' },
      { icon: Share2, label: 'Share Sick Leave',    to: 'prescriptions' },
      { icon: Receipt, label: 'Submit Claim',        to: 'reimbursements' },
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
      { icon: Calendar, value: 8,   label: "Today's Appointments" },
      { icon: Users, value: 145, label: 'Total Patients' },
      { icon: FileText, value: 23,  label: 'Prescriptions Written' },
      { icon: Receipt, value: 3,   label: 'Claims to Review' },
    ],
    actions: [
      { icon: Calendar, label: 'View Appointment Queue', to: 'appointments' },
      { icon: PenSquare, label: 'Write Prescription',     to: 'prescriptions' },
      { icon: Receipt, label: 'Review Reimbursements',  to: 'claims' },
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
      { icon: KeyRound, value: 5,  label: 'OTPs Pending' },
      { icon: Pill, value: 12, label: 'Dispensed Today' },
      { icon: AlertTriangle, value: 3,  label: 'Low Stock Items' },
      { icon: Boxes, value: 48, label: 'Total Medicines' },
    ],
    actions: [
      { icon: KeyRound, label: 'Verify OTP',         to: 'dispense' },
      { icon: Boxes, label: 'Check Inventory',    tag: 'M7' },
      { icon: RotateCcw, label: 'Log Restock Entry',  tag: 'M7' },
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
      { icon: Users, value: 198, label: 'Total Users' },
      { icon: Stethoscope, value: 12, label: 'Doctors' },
      { icon: GraduationCap, value: 184, label: 'Students' },
      { icon: Pill, value: 2,   label: 'Pharmacists' },
    ],
    actions: [
      { icon: Users, label: 'Manage Users',       tag: 'M8' },
      { icon: Activity, label: 'View System Logs',   tag: 'M8' },
      { icon: Settings, label: 'Inventory Settings', tag: 'M7' },
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
          <p className="dash-greeting">Good day, {firstName}</p>
          <h2 className="dash-name">{user?.name}</h2>
          <span className="dash-badge">
            {role.charAt(0).toUpperCase() + role.slice(1)} Portal · UniCare
          </span>
        </div>
        <div className="dash-hero-glyph">
          <HeartPulse size={48} />
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {data.stats.map((s, i) => {
          const StatIcon = s.icon
          return (
            <div key={i} className="stat-card">
              <span className="stat-icon">
                <StatIcon size={22} />
              </span>
              <p className="stat-value">{s.value}</p>
              <p className="stat-label">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Bottom: actions + activity */}
      <div className="dash-bottom">

        <div className="dash-section">
          <p className="dash-section-title">Quick Actions</p>
          <div className="actions-list">
            {data.actions.map((a, i) => {
              const ActionIcon = a.icon
              return (
                <button
                  key={i}
                  className="action-btn"
                  title={a.to ? undefined : `Available in ${a.tag}`}
                  disabled={!a.to}
                  onClick={a.to ? () => navigate(`/panel/${role}/${a.to}`) : undefined}
                >
                  <span className="action-icon">
                    <ActionIcon size={18} />
                  </span>
                  <span>{a.label}</span>
                  {a.tag && <span className="milestone-tag">{a.tag}</span>}
                </button>
              )
            })}
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
