import { useEffect, useState } from 'react'
import {
  Activity,
  Filter,
  Shield,
  User,
  KeyRound,
  FileText,
  Boxes,
  Receipt,
  Calendar,
  Clock,
  RotateCcw
} from 'lucide-react'
import api from '../api'

const fmtDateTime = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return isNaN(date.getTime()) ? '' : date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const CATEGORY_MAP = {
  all:           { label: 'All Events',     icon: Activity,  color: '#3b82f6' },
  auth:          { label: 'Auth & Access',  icon: KeyRound,  color: '#8b5cf6' },
  user:          { label: 'User Admin',     icon: User,      color: '#0d9488' },
  clinical:      { label: 'Clinical',       icon: FileText,  color: '#059669' },
  pharmacy:      { label: 'Pharmacy',       icon: Boxes,     color: '#d97706' },
  reimbursement: { label: 'Reimbursements', icon: Receipt,   color: '#dc2626' },
}

export default function AdminSystemLogs() {
  const [logs, setLogs]                 = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const loadLogs = async (cat = categoryFilter) => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (cat !== 'all') params.category = cat
      const { data } = await api.get('/admin/logs', { params })
      setLogs(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch system audit logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const handleCategoryChange = (cat) => {
    setCategoryFilter(cat)
    loadLogs(cat)
  }

  return (
    <div className="dashboard">
      {/* Banner */}
      <div className="dash-hero">
        <div>
          <p className="dash-greeting" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Activity size={16} /> Audit Trail & System Logs
          </p>
          <h2 className="dash-name">Platform Event History</h2>
          <span className="dash-badge">
            Real-Time Chronological Security & Operational Log
          </span>
        </div>
        <div className="dash-hero-glyph">
          <Activity size={48} />
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-2)', padding: '0.25rem', borderRadius: 'var(--r-md)', flexWrap: 'wrap' }}>
          {Object.entries(CATEGORY_MAP).map(([catKey, cat]) => {
            const Icon = cat.icon
            const isSelected = categoryFilter === catKey
            return (
              <button
                key={catKey}
                className="slot-btn"
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: isSelected ? '600' : 'normal',
                  background: isSelected ? 'var(--bg)' : 'transparent',
                  borderColor: isSelected ? 'var(--border-strong)' : 'transparent',
                  color: isSelected ? 'var(--accent)' : 'var(--text-sub)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
                onClick={() => handleCategoryChange(catKey)}
              >
                <Icon size={14} /> {cat.label}
              </button>
            )
          })}
        </div>

        <button
          className="slot-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: 'var(--fs-xs)' }}
          onClick={() => loadLogs()}
        >
          <RotateCcw size={13} /> Refresh Logs
        </button>
      </div>

      {/* Logs Table / Timeline List */}
      <div className="dash-section" style={{ margin: 0, padding: '1rem' }}>
        <p className="dash-section-title">Events ({logs.length})</p>

        {loading ? (
          <p className="activity-empty">Loading audit events…</p>
        ) : logs.length === 0 ? (
          <p className="activity-empty">No system log entries found for this category.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {logs.map(log => {
              const catConfig = CATEGORY_MAP[log.category] || CATEGORY_MAP.all
              const CatIcon = catConfig.icon

              return (
                <div
                  key={log._id}
                  className="appt-row"
                  style={{
                    background: 'var(--bg)',
                    padding: '0.85rem 1.1rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  {/* Left: Icon & Description */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: '1 1 340px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: 'var(--r-sm)',
                        display: 'grid',
                        placeItems: 'center',
                        background: 'var(--surface-2)',
                        color: catConfig.color,
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      <CatIcon size={16} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'var(--surface-2)',
                            color: catConfig.color
                          }}
                        >
                          {log.action?.replace(/_/g, ' ')}
                        </span>
                        <strong style={{ fontSize: 'var(--fs-sm)' }}>{log.details}</strong>
                      </div>
                      
                      <div className="stat-label" style={{ marginTop: '0.2rem', fontSize: 'var(--fs-xs)' }}>
                        Performed by: <strong>{log.performedBy?.name || 'System Operator'}</strong>
                        {log.performedBy?.role && ` (${log.performedBy.role})`}
                        {log.targetUser && ` · Target: ${log.targetUser.name}`}
                      </div>
                    </div>
                  </div>

                  {/* Right: Timestamp */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className="stat-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: 'var(--fs-xs)' }}>
                      <Clock size={12} /> {fmtDateTime(log.timestamp)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
