import { useState } from 'react'
import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Stethoscope,
  Pill,
  Shield,
  LayoutDashboard,
  Calendar,
  FileText,
  Receipt,
  HeartPulse,
  KeyRound,
  Boxes,
  History,
  Users,
  Activity,
  Lock,
  LogOut,
  PenSquare
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ChangePasswordModal from '../components/ChangePasswordModal'

// Role configuration — expand nav arrays in future milestones
const ROLE_CONFIG = {
  student: {
    label:   'Student',
    icon:    GraduationCap,
    color:   '#3b82f6',
    bgColor: 'rgba(59,130,246,.15)',
    nav: [
      { to: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: 'appointments', icon: Calendar, label: 'Appointments' },
      { to: 'prescriptions', icon: FileText, label: 'Prescriptions' },
      { to: 'reimbursements', icon: Receipt, label: 'Reimbursements' },
      { to: 'medical-details', icon: HeartPulse, label: 'Medical Profile' },
    ],
  },
  doctor: {
    label:   'Doctor',
    icon:    Stethoscope,
    color:   '#0d9488',
    bgColor: 'rgba(13,148,136,.15)',
    nav: [
      { to: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: 'appointments', icon: Calendar, label: 'Appointment Queue' },
      { to: 'prescriptions', icon: PenSquare, label: 'Prescriptions' },
      { to: 'claims', icon: Receipt, label: 'Review Claims' },
    ],
  },
  pharmacist: {
    label:   'Pharmacist',
    icon:    Pill,
    color:   '#7c3aed',
    bgColor: 'rgba(124,58,237,.15)',
    nav: [
      { to: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: 'dispense', icon: KeyRound, label: 'Verify OTP' },
      { to: 'inventory', icon: Boxes, label: 'Inventory' },
      { to: 'restock-log', icon: History, label: 'Restock Log' },
    ],
  },
  admin: {
    label:   'Admin',
    icon:    Shield,
    color:   '#d97706',
    bgColor: 'rgba(217,119,6,.15)',
    nav: [
      { to: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: 'users', icon: Users, label: 'Manage Users' },
      { to: 'logs', icon: Activity, label: 'System Logs' },
      { to: 'inventory', icon: Boxes, label: 'Inventory Settings' },
    ],
  },
}

export default function PanelLayout() {
  const { role }     = useParams()
  const { user, logout } = useAuth()
  const navigate     = useNavigate()
  const [isPassModalOpen, setIsPassModalOpen] = useState(false)
  const cfg          = ROLE_CONFIG[role] ?? ROLE_CONFIG.student
  const RoleIcon     = cfg.icon

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
          <div className="sidebar-logo-icon">
            <HeartPulse size={20} />
          </div>
          <span>UniCare</span>
        </div>

        {/* Role card */}
        <div className="sidebar-role-card">
          <div className="role-avatar">
            <RoleIcon size={18} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p className="role-info-label">{cfg.label}</p>
            <p className="role-info-name">{user?.name ?? '—'}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Menu</span>

          {cfg.nav.map((item, i) => {
            const Icon = item.icon
            return item.to ? (
              <NavLink
                key={i}
                to={`/panel/${role}/${item.to}`}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-link-icon"><Icon size={18} /></span>
                {item.label}
              </NavLink>
            ) : (
              <button key={i} className="nav-link" style={{ cursor: 'not-allowed', width: '100%', border: 'none', background: 'none', textAlign: 'left' }}>
                <span className="nav-link-icon"><Icon size={18} /></span>
                {item.label}
                <span className="nav-link-coming">{item.coming}</span>
              </button>
            )
          })}
        </nav>

        {/* Change Password & Logout */}
        <button
          className="sidebar-logout"
          style={{ marginBottom: '.4rem' }}
          onClick={() => setIsPassModalOpen(true)}
        >
          <Lock size={15} /> Change Password
        </button>

        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={15} /> Sign Out
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className="panel-main">
        <Outlet />
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
      />
    </div>
  )
}
