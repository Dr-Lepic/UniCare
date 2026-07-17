import { useEffect, useState } from 'react'
import api from '../api'

const fmtDateTime = (d) => new Date(d).toLocaleString(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

export default function PharmacistRestockLog() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const loadLogs = async () => {
    try {
      const { data } = await api.get('/medicines/logs')
      setLogs(data)
    } catch (err) {
      setError('Failed to fetch inventory logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  return (
    <div className="dashboard">
      {/* Banner */}
      <div className="dash-hero" style={{ padding: '2rem 1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
        <div>
          <p className="dash-greeting">🔄 Inventory Logs</p>
          <h2 className="dash-name" style={{ fontSize: 'var(--fs-xl)', margin: '0.2rem 0' }}>Transaction History</h2>
          <span className="dash-badge" style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
            Chronological log of all stock increases and dispensing events
          </span>
        </div>
        <div className="dash-hero-glyph">🔄</div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <div className="dash-section" style={{ margin: 0 }}>
        <p className="dash-section-title">Stock Action Log</p>

        {loading ? (
          <p className="activity-empty">Loading logs timeline…</p>
        ) : logs.length === 0 ? (
          <p className="activity-empty">No inventory activities logged yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {logs.map(log => {
              const isRestock = log.reason === 'restocked'
              const qtyFormatted = log.changeQty > 0 ? `+${log.changeQty}` : log.changeQty
              
              return (
                <div
                  key={log._id}
                  className="appt-row"
                  style={{
                    background: 'var(--bg)',
                    padding: '0.9rem 1.25rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  {/* Left info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 'var(--fs-md)' }}>
                        {log.medicine?.name || 'Deleted Medicine'}
                      </strong>
                      <span className={`status-pill ${isRestock ? 'status-pill--completed' : 'status-pill--confirmed'}`}>
                        {log.reason}
                      </span>
                    </div>
                    <div className="stat-label" style={{ marginTop: '0.15rem' }}>
                      Performed by: <strong>{log.performedBy?.name || 'System'}</strong> ({log.performedBy?.role || 'operator'}) · {fmtDateTime(log.timestamp)}
                    </div>
                  </div>

                  {/* Right info (Change Qty) */}
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: 'var(--fs-lg)',
                        fontWeight: '700',
                        color: isRestock ? '#059669' : '#dc2626'
                      }}
                    >
                      {qtyFormatted}
                    </span>
                    <span className="stat-label" style={{ marginLeft: '0.2rem', textTransform: 'lowercase' }}>
                      {log.medicine?.unit || 'unit'}s
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
