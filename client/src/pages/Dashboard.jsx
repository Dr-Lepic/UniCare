import { useEffect, useState } from 'react'
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
  HeartPulse,
  Clock
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const fmtDate = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const ACTION_CONFIG = {
  student: [
    { icon: Calendar, label: 'Book Appointment',   to: 'appointments' },
    { icon: FileText, label: 'View Prescriptions',  to: 'prescriptions' },
    { icon: Share2, label: 'Share Sick Leave',    to: 'prescriptions' },
    { icon: Receipt, label: 'Submit Claim',        to: 'reimbursements' },
  ],
  doctor: [
    { icon: Calendar, label: 'View Appointment Queue', to: 'appointments' },
    { icon: PenSquare, label: 'Write Prescription',     to: 'prescriptions' },
    { icon: Receipt, label: 'Review Reimbursements',  to: 'claims' },
  ],
  pharmacist: [
    { icon: KeyRound, label: 'Verify OTP',         to: 'dispense' },
    { icon: Boxes, label: 'Check Inventory',    to: 'inventory' },
    { icon: RotateCcw, label: 'Log Restock Entry',  to: 'restock-log' },
  ],
  admin: [
    { icon: Users, label: 'Manage Users', to: 'users' },
    { icon: Activity, label: 'View System Logs', to: 'logs' },
    { icon: Settings, label: 'Inventory Settings', to: 'inventory' },
  ],
}

export default function Dashboard() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const role       = user?.role || 'student'
  const firstName  = user?.name?.split(' ')[0] ?? 'User'

  const [loading, setLoading]   = useState(true)
  const [stats, setStats]       = useState([])
  const [activity, setActivity] = useState([])

  useEffect(() => {
    let isMounted = true

    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        if (role === 'student') {
          const [apptsRes, rxRes, claimsRes] = await Promise.allSettled([
            api.get('/appointments/mine'),
            api.get('/prescriptions/mine'),
            api.get('/reimbursements/mine'),
          ])

          const appts = apptsRes.status === 'fulfilled' ? apptsRes.value.data : []
          const rxList = rxRes.status === 'fulfilled' ? rxRes.value.data : []
          const claims = claimsRes.status === 'fulfilled' ? claimsRes.value.data : []

          const todayStr = new Date().toISOString().slice(0, 10)
          const totalVisits = appts.filter(a => a.status === 'completed').length || rxList.length
          const upcomingAppts = appts.filter(a => (a.status === 'pending' || a.status === 'confirmed') && new Date(a.date).toISOString().slice(0, 10) >= todayStr).length
          const activeRx = rxList.filter(p => p.status !== 'dispensed').length
          const pendingClaims = claims.filter(c => c.status === 'pending').length

          if (isMounted) {
            setStats([
              { icon: Hospital, value: totalVisits, label: 'Total Visits' },
              { icon: Calendar, value: upcomingAppts, label: 'Upcoming Appointments' },
              { icon: Pill, value: activeRx, label: 'Active Prescriptions' },
              { icon: Receipt, value: pendingClaims, label: 'Pending Claims' },
            ])

            // Combine recent activity
            const act = []
            appts.forEach(a => {
              act.push({
                text: `Appointment (${a.status}) with Dr. ${a.doctor?.name || 'Doctor'} — ${fmtDate(a.date)}`,
                time: new Date(a.createdAt || a.date).getTime()
              })
            })
            rxList.forEach(p => {
              act.push({
                text: `Prescription issued by Dr. ${p.doctor?.name || 'Doctor'} — ${fmtDate(p.createdAt)}`,
                time: new Date(p.createdAt).getTime()
              })
            })
            claims.forEach(c => {
              act.push({
                text: `Claim (${c.status}) for ${c.hospitalName} (${c.amount} BDT) — ${fmtDate(c.createdAt)}`,
                time: new Date(c.createdAt).getTime()
              })
            })

            act.sort((a, b) => b.time - a.time)
            setActivity(act.slice(0, 5).map(x => x.text))
          }
        } else if (role === 'doctor') {
          const [apptsRes, rxRes, claimsRes, studentsRes] = await Promise.allSettled([
            api.get('/appointments/mine'),
            api.get('/prescriptions/mine'),
            api.get('/reimbursements/mine'),
            api.get('/students'),
          ])

          const appts = apptsRes.status === 'fulfilled' ? apptsRes.value.data : []
          const rxList = rxRes.status === 'fulfilled' ? rxRes.value.data : []
          const claims = claimsRes.status === 'fulfilled' ? claimsRes.value.data : []
          const students = studentsRes.status === 'fulfilled' ? studentsRes.value.data : []

          const todayStr = new Date().toISOString().slice(0, 10)
          const todayAppts = appts.filter(a => new Date(a.date).toISOString().slice(0, 10) === todayStr && a.status !== 'cancelled').length
          const totalPatients = students.length || new Set(appts.map(a => a.student?._id || a.student)).size
          const rxWritten = rxList.length
          const claimsToReview = claims.filter(c => c.status === 'pending').length

          if (isMounted) {
            setStats([
              { icon: Calendar, value: todayAppts, label: "Today's Appointments" },
              { icon: Users, value: totalPatients, label: 'Total Patients' },
              { icon: FileText, value: rxWritten, label: 'Prescriptions Written' },
              { icon: Receipt, value: claimsToReview, label: 'Claims to Review' },
            ])

            // Combine doctor activity
            const act = []
            appts.forEach(a => {
              act.push({
                text: `Appointment (${a.status}) — ${a.student?.name || 'Student'} (${a.timeSlot}), ${fmtDate(a.date)}`,
                time: new Date(a.createdAt || a.date).getTime()
              })
            })
            rxList.forEach(p => {
              act.push({
                text: `Prescription issued for ${p.student?.name || 'Student'} — ${fmtDate(p.createdAt)}`,
                time: new Date(p.createdAt).getTime()
              })
            })
            claims.forEach(c => {
              act.push({
                text: `Claim (${c.status}) from ${c.student?.name || 'Student'} — ${fmtDate(c.createdAt)}`,
                time: new Date(c.createdAt).getTime()
              })
            })

            act.sort((a, b) => b.time - a.time)
            setActivity(act.slice(0, 5).map(x => x.text))
          }
        } else if (role === 'pharmacist') {
          const [medsRes, logsRes] = await Promise.allSettled([
            api.get('/medicines'),
            api.get('/medicines/logs'),
          ])

          const meds = medsRes.status === 'fulfilled' ? medsRes.value.data : []
          const logs = logsRes.status === 'fulfilled' ? logsRes.value.data : []

          const todayStr = new Date().toISOString().slice(0, 10)
          const lowStock = meds.filter(m => m.stockQty <= m.reorderThreshold).length
          const totalMeds = meds.length
          const dispensedToday = logs.filter(l => l.reason === 'dispensed' && new Date(l.timestamp).toISOString().slice(0, 10) === todayStr).length
          const totalLogs = logs.length

          if (isMounted) {
            setStats([
              { icon: RotateCcw, value: totalLogs, label: 'Inventory Actions' },
              { icon: Pill, value: dispensedToday, label: 'Dispensed Today' },
              { icon: AlertTriangle, value: lowStock, label: 'Low Stock Alerts' },
              { icon: Boxes, value: totalMeds, label: 'Total Medicines' },
            ])

            const act = logs.map(l => ({
              text: `${l.reason === 'restocked' ? 'Stock restocked' : 'Dispensed'}: ${l.medicine?.name || 'Item'} (${l.changeQty > 0 ? '+' : ''}${l.changeQty} ${l.medicine?.unit || 'unit'}s) — ${fmtDate(l.timestamp)}`,
              time: new Date(l.timestamp).getTime()
            }))

            act.sort((a, b) => b.time - a.time)
            setActivity(act.slice(0, 5).map(x => x.text))
          }
        } else if (role === 'admin') {
          const statsRes = await api.get('/admin/stats')
          const data = statsRes.data

          if (isMounted) {
            setStats([
              { icon: Users, value: data.users?.total ?? 0, label: 'Total Users' },
              { icon: Stethoscope, value: data.users?.doctors ?? 0, label: 'Doctors' },
              { icon: GraduationCap, value: data.users?.students ?? 0, label: 'Students' },
              { icon: Pill, value: data.users?.pharmacists ?? 0, label: 'Pharmacists' },
            ])

            const act = (data.recentActivity || []).map(l => (
              `${l.details} — ${fmtDate(l.timestamp)}`
            ))

            setActivity(act)
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchDashboardData()

    return () => {
      isMounted = false
    }
  }, [role])

  const actions = ACTION_CONFIG[role] ?? ACTION_CONFIG.student

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
        {stats.map((s, i) => {
          const StatIcon = s.icon
          return (
            <div key={i} className="stat-card">
              <span className="stat-icon">
                <StatIcon size={22} />
              </span>
              <p className="stat-value">{loading ? '…' : s.value}</p>
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
            {actions.map((a, i) => {
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
          {loading ? (
            <p className="activity-empty">Loading latest activity…</p>
          ) : activity.length ? (
            <ul className="activity-list">
              {activity.map((item, i) => (
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
