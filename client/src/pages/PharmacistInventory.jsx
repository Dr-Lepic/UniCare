import { useEffect, useState } from 'react'
import api from '../api'

export default function PharmacistInventory() {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  
  // Selected medicine for Restock & Settings
  const [selectedMed, setSelectedMed] = useState(null)
  
  // Form Tabs State
  const [activeFormTab, setActiveFormTab] = useState('restock') // 'restock', 'add', 'threshold'

  // Form inputs
  const [restockQty, setRestockQty]       = useState('')
  const [newMed, setNewMed]               = useState({ name: '', stockQty: '0', unit: 'tablet', reorderThreshold: '10' })
  const [newThreshold, setNewThreshold]   = useState('')
  
  const [submitting, setSubmitting]       = useState(false)

  const loadMedicines = async () => {
    try {
      const { data } = await api.get('/medicines')
      setMedicines(data)
      // Keep selected reference fresh if it exists
      if (selectedMed) {
        const fresh = data.find(m => m._id === selectedMed._id)
        setSelectedMed(fresh || null)
      }
    } catch (err) {
      setError('Failed to fetch medicine inventory.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMedicines()
  }, [])

  const handleRestockSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!selectedMed) return setError('Please select a medicine from the list first.')
    if (!restockQty || isNaN(restockQty) || Number(restockQty) <= 0) {
      return setError('Please enter a valid positive quantity.')
    }

    setSubmitting(true)
    try {
      await api.post(`/medicines/${selectedMed._id}/restock`, { qty: Number(restockQty) })
      setSuccess(`Successfully restocked ${selectedMed.name} (+${restockQty} ${selectedMed.unit}s)!`)
      setRestockQty('')
      loadMedicines()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restock medicine.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddNewSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const { name, stockQty, unit, reorderThreshold } = newMed
    if (!name.trim()) return setError('Please enter a name.')
    if (stockQty === '' || isNaN(stockQty) || Number(stockQty) < 0) {
      return setError('Stock quantity must be a non-negative number.')
    }
    if (!unit.trim()) return setError('Please enter a unit (e.g. tablet).')
    if (reorderThreshold === '' || isNaN(reorderThreshold) || Number(reorderThreshold) < 0) {
      return setError('Reorder threshold must be a non-negative number.')
    }

    setSubmitting(true)
    try {
      const { data } = await api.post('/medicines', {
        name: name.trim(),
        stockQty: Number(stockQty),
        unit: unit.trim(),
        reorderThreshold: Number(reorderThreshold)
      })
      setSuccess(`Successfully added new medicine: ${data.name}!`)
      setNewMed({ name: '', stockQty: '0', unit: 'tablet', reorderThreshold: '10' })
      loadMedicines()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add new medicine.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleThresholdSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedMed) return setError('Please select a medicine from the list first.')
    if (newThreshold === '' || isNaN(newThreshold) || Number(newThreshold) < 0) {
      return setError('Please enter a valid non-negative threshold quantity.')
    }

    setSubmitting(true)
    try {
      await api.patch(`/medicines/${selectedMed._id}`, { reorderThreshold: Number(newThreshold) })
      setSuccess(`Successfully updated reorder threshold for ${selectedMed.name} to ${newThreshold} ${selectedMed.unit}s!`)
      setNewThreshold('')
      loadMedicines()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update threshold.')
    } finally {
      setSubmitting(false)
    }
  }

  const lowStockItems = medicines.filter(m => m.stockQty <= m.reorderThreshold)
  const totalItems = medicines.length

  return (
    <div className="dashboard">
      {/* Banner */}
      <div className="dash-hero" style={{ padding: '2rem 1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)' }}>
        <div>
          <p className="dash-greeting">📦 Pharmacy Inventory</p>
          <h2 className="dash-name" style={{ fontSize: 'var(--fs-xl)', margin: '0.2rem 0' }}>Manage Stock Levels</h2>
          <span className="dash-badge" style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
            {totalItems} Catalog Items · {lowStockItems.length} Low Stock Alerts
          </span>
        </div>
        <div className="dash-hero-glyph">📦</div>
      </div>

      {/* Global error/success notifications */}
      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="alert" style={{ borderColor: '#a7f3d0', borderLeftColor: '#059669', background: '#ecfdf5', color: '#047857', marginBottom: '1.5rem' }}>{success}</div>}

      {/* Low-stock warnings panel */}
      {lowStockItems.length > 0 && (
        <div className="dash-section" style={{ borderLeft: '4px solid #d97706', background: '#fffbeb', marginBottom: '1.5rem' }}>
          <p className="dash-section-title" style={{ color: '#92400e' }}>⚠️ Urgent Low Stock Alerts</p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {lowStockItems.map(m => (
              <li key={m._id} style={{ fontSize: 'var(--fs-sm)', color: '#b45309' }}>
                • <strong>{m.name}</strong> has only <strong>{m.stockQty} {m.unit}s</strong> remaining (Reorder Threshold: {m.reorderThreshold} {m.unit}s)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Two column split layout */}
      <div className="dash-bottom" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Medicine Inventory List */}
        <div className="dash-section" style={{ margin: 0 }}>
          <p className="dash-section-title">Stock Catalog</p>
          
          {loading ? (
            <p className="activity-empty">Loading inventory catalog…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {medicines.map(m => {
                const isLow = m.stockQty <= m.reorderThreshold
                const isSelected = selectedMed?._id === m._id
                return (
                  <div
                    key={m._id}
                    className="appt-row"
                    style={{
                      border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: 'var(--bg)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--r-md)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => {
                      setSelectedMed(m)
                      setError('')
                      setSuccess('')
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 'var(--fs-md)' }}>{m.name}</strong>
                      <div className="stat-label" style={{ marginTop: '0.1rem' }}>
                        Reorder Threshold: {m.reorderThreshold} {m.unit}s · Last Restocked: {m.lastRestockedAt ? fmtDate(m.lastRestockedAt) : 'Never'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div>
                        <strong style={{ fontSize: 'var(--fs-md)' }}>{m.stockQty}</strong>
                        <span className="stat-label" style={{ marginLeft: '0.2rem', textTransform: 'lowercase' }}>{m.unit}s</span>
                      </div>
                      <span className={`status-pill ${isLow ? 'status-pill--cancelled' : 'status-pill--completed'}`}>
                        {isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Tab buttons */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-2)', padding: '0.25rem', borderRadius: 'var(--r-md)' }}>
            <button
              className="slot-btn"
              style={{
                flex: 1,
                padding: '0.4rem 0.2rem',
                fontSize: 'var(--fs-xs)',
                fontWeight: activeFormTab === 'restock' ? '600' : 'normal',
                background: activeFormTab === 'restock' ? 'var(--bg)' : 'transparent',
                borderColor: activeFormTab === 'restock' ? 'var(--border-strong)' : 'transparent',
                color: activeFormTab === 'restock' ? 'var(--text)' : 'var(--text-sub)'
              }}
              onClick={() => setActiveFormTab('restock')}
            >
              🔄 Restock
            </button>
            <button
              className="slot-btn"
              style={{
                flex: 1,
                padding: '0.4rem 0.2rem',
                fontSize: 'var(--fs-xs)',
                fontWeight: activeFormTab === 'threshold' ? '600' : 'normal',
                background: activeFormTab === 'threshold' ? 'var(--bg)' : 'transparent',
                borderColor: activeFormTab === 'threshold' ? 'var(--border-strong)' : 'transparent',
                color: activeFormTab === 'threshold' ? 'var(--text)' : 'var(--text-sub)'
              }}
              onClick={() => setActiveFormTab('threshold')}
            >
              ⚙️ Threshold
            </button>
            <button
              className="slot-btn"
              style={{
                flex: 1,
                padding: '0.4rem 0.2rem',
                fontSize: 'var(--fs-xs)',
                fontWeight: activeFormTab === 'add' ? '600' : 'normal',
                background: activeFormTab === 'add' ? 'var(--bg)' : 'transparent',
                borderColor: activeFormTab === 'add' ? 'var(--border-strong)' : 'transparent',
                color: activeFormTab === 'add' ? 'var(--text)' : 'var(--text-sub)'
              }}
              onClick={() => setActiveFormTab('add')}
            >
              ➕ Add New
            </button>
          </div>

          {/* Tab 1: Restock Medicine */}
          {activeFormTab === 'restock' && (
            <div className="dash-section" style={{ margin: 0 }}>
              <p className="dash-section-title">Manual Restock</p>
              {selectedMed ? (
                <form onSubmit={handleRestockSubmit}>
                  <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginBottom: '1.1rem' }}>
                    <span className="role-info-label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.2rem' }}>SELECTED MEDICINE</span>
                    <strong>{selectedMed.name}</strong>
                    <p className="stat-label" style={{ margin: 0 }}>Current Stock: {selectedMed.stockQty} {selectedMed.unit}s</p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="restockQty">Quantity to Add ({selectedMed.unit}s)</label>
                    <input
                      id="restockQty"
                      type="number"
                      min="1"
                      placeholder="e.g. 100"
                      value={restockQty}
                      onChange={e => setRestockQty(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-submit" disabled={submitting}>
                    {submitting ? 'Restocking…' : `Add ${restockQty || '0'} ${selectedMed.unit}s`}
                  </button>
                </form>
              ) : (
                <p className="activity-empty" style={{ padding: '2rem 1rem' }}>Select a medicine from the catalog list to restock it.</p>
              )}
            </div>
          )}

          {/* Tab 2: Adjust Threshold */}
          {activeFormTab === 'threshold' && (
            <div className="dash-section" style={{ margin: 0 }}>
              <p className="dash-section-title">Adjust Reorder Threshold</p>
              {selectedMed ? (
                <form onSubmit={handleThresholdSubmit}>
                  <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginBottom: '1.1rem' }}>
                    <span className="role-info-label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.2rem' }}>SELECTED MEDICINE</span>
                    <strong>{selectedMed.name}</strong>
                    <p className="stat-label" style={{ margin: 0 }}>Current Threshold: {selectedMed.reorderThreshold} {selectedMed.unit}s</p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="threshold">New Reorder Threshold ({selectedMed.unit}s)</label>
                    <input
                      id="threshold"
                      type="number"
                      min="0"
                      placeholder="e.g. 20"
                      value={newThreshold}
                      onChange={e => setNewThreshold(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-submit" disabled={submitting}>
                    {submitting ? 'Updating…' : 'Save Settings'}
                  </button>
                </form>
              ) : (
                <p className="activity-empty" style={{ padding: '2rem 1rem' }}>Select a medicine from the catalog list to adjust its threshold.</p>
              )}
            </div>
          )}

          {/* Tab 3: Add New Medicine */}
          {activeFormTab === 'add' && (
            <div className="dash-section" style={{ margin: 0 }}>
              <p className="dash-section-title">Add New Medicine</p>
              <form onSubmit={handleAddNewSubmit}>
                <div className="form-group">
                  <label htmlFor="newName">Medicine Name</label>
                  <input
                    id="newName"
                    type="text"
                    placeholder="e.g. Ibuprofen 200mg"
                    value={newMed.name}
                    onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newUnit">Unit Type</label>
                  <select
                    id="newUnit"
                    value={newMed.unit}
                    onChange={e => setNewMed({ ...newMed, unit: e.target.value })}
                    required
                  >
                    <option value="tablet">Tablet</option>
                    <option value="capsule">Capsule</option>
                    <option value="sachet">Sachet</option>
                    <option value="bottle">Bottle</option>
                    <option value="tube">Tube</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="newStock">Initial Stock Qty</label>
                  <input
                    id="newStock"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newMed.stockQty}
                    onChange={e => setNewMed({ ...newMed, stockQty: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newThreshold">Reorder Alert Threshold</label>
                  <input
                    id="newThreshold"
                    type="number"
                    min="0"
                    placeholder="10"
                    value={newMed.reorderThreshold}
                    onChange={e => setNewMed({ ...newMed, reorderThreshold: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Add Medicine'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
