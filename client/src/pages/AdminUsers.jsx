import { useEffect, useState } from 'react'
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  GraduationCap,
  Stethoscope,
  Pill,
  Shield,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import api from '../api'

const ROLE_BADGES = {
  student:    { label: 'Student',    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: GraduationCap },
  doctor:     { label: 'Doctor',     color: '#0d9488', bg: 'rgba(13,148,136,0.12)', icon: Stethoscope },
  pharmacist: { label: 'Pharmacist', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', icon: Pill },
  admin:      { label: 'Admin',      color: '#d97706', bg: 'rgba(217,119,6,0.12)', icon: Shield },
}

export default function AdminUsers() {
  const [users, setUsers]                 = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState('')
  
  // Filters
  const [roleFilter, setRoleFilter]       = useState('all')
  const [searchQuery, setSearchQuery]     = useState('')

  // Modals
  const [isAddOpen, setIsAddOpen]         = useState(false)
  const [editingUser, setEditingUser]     = useState(null)
  const [resetPassUser, setResetPassUser] = useState(null)
  const [deletingUser, setDeletingUser]   = useState(null)
  
  // Form states
  const [newPassword, setNewPassword]     = useState('')
  const [submitting, setSubmitting]       = useState(false)
  
  // Add/Edit Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '',
    department: '',
    age: '',
    program: '',
    contact: '',
    specialty: '',
    station: ''
  })

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/admin/users')
      setUsers(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      studentId: '',
      department: '',
      age: '',
      program: '',
      contact: '',
      specialty: 'General Physician',
      station: 'Main Pharmacy Counter'
    })
    setIsAddOpen(true)
    setError('')
    setSuccess('')
  }

  const handleOpenEdit = (u) => {
    setEditingUser(u)
    setFormData({
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'student',
      studentId: u.studentId || '',
      department: u.department || '',
      age: u.age || '',
      program: u.program || '',
      contact: u.contact || '',
      specialty: u.specialty || '',
      station: u.station || ''
    })
    setError('')
    setSuccess('')
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/admin/users', formData)
      setSuccess(`User ${formData.name} created successfully!`)
      setIsAddOpen(false)
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await api.put(`/admin/users/${editingUser._id}`, formData)
      setSuccess(`User ${formData.name} updated successfully!`)
      setEditingUser(null)
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetPassSubmit = async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      return setError('Password must be at least 6 characters long.')
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await api.put(`/admin/users/${resetPassUser._id}/reset-password`, { newPassword })
      setSuccess(`Password for ${resetPassUser.name} reset successfully!`)
      setResetPassUser(null)
      setNewPassword('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await api.delete(`/admin/users/${deletingUser._id}`)
      setSuccess(`User ${deletingUser.name} deleted successfully!`)
      setDeletingUser(null)
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.')
    } finally {
      setSubmitting(false)
    }
  }

  // Filtered users list
  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchName = u.name?.toLowerCase().includes(q)
      const matchEmail = u.email?.toLowerCase().includes(q)
      const matchId = u.studentId?.toLowerCase().includes(q)
      const matchDept = u.department?.toLowerCase().includes(q)
      const matchSpec = u.specialty?.toLowerCase().includes(q)
      return matchName || matchEmail || matchId || matchDept || matchSpec
    }
    return true
  })

  return (
    <div className="dashboard">
      {/* Banner */}
      <div className="dash-hero" style={{ padding: '2rem 1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)' }}>
        <div>
          <p className="dash-greeting" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users size={16} /> User Management
          </p>
          <h2 className="dash-name" style={{ fontSize: 'var(--fs-xl)', margin: '0.2rem 0' }}>Accounts & Permissions</h2>
          <span className="dash-badge" style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
            {users.length} Total Users Across All Roles
          </span>
        </div>
        <div className="dash-hero-glyph">
          <Users size={48} />
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div className="alert" style={{ borderColor: '#a7f3d0', borderLeftColor: '#059669', background: '#ecfdf5', color: '#047857', marginBottom: '1.5rem' }}>{success}</div>}

      {/* Control Bar: Filters, Search, Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {/* Role Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-2)', padding: '0.25rem', borderRadius: 'var(--r-md)' }}>
          {['all', 'student', 'doctor', 'pharmacist', 'admin'].map(r => (
            <button
              key={r}
              className="slot-btn"
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: 'var(--fs-xs)',
                fontWeight: roleFilter === r ? '600' : 'normal',
                background: roleFilter === r ? 'var(--bg)' : 'transparent',
                borderColor: roleFilter === r ? 'var(--border-strong)' : 'transparent',
                color: roleFilter === r ? 'var(--accent)' : 'var(--text-sub)',
                textTransform: 'capitalize'
              }}
              onClick={() => setRoleFilter(r)}
            >
              {r === 'all' ? 'All Roles' : r + 's'}
            </button>
          ))}
        </div>

        {/* Search & Add button */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: '1 1 300px', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '320px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              type="text"
              placeholder="Search by name, ID, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '2rem', paddingRight: '0.75rem', height: '36px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-strong)', background: 'var(--bg)', fontSize: 'var(--fs-sm)' }}
            />
          </div>
          <button
            className="btn-submit"
            style={{ width: 'auto', padding: '0.45rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
            onClick={handleOpenAdd}
          >
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Users List Table */}
      <div className="dash-section" style={{ margin: 0, padding: '1rem' }}>
        <p className="dash-section-title">Directory ({filteredUsers.length})</p>

        {loading ? (
          <p className="activity-empty">Loading user accounts…</p>
        ) : filteredUsers.length === 0 ? (
          <p className="activity-empty">No users match the search filter.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {filteredUsers.map(u => {
              const badge = ROLE_BADGES[u.role] || ROLE_BADGES.student
              const RoleIcon = badge.icon

              return (
                <div
                  key={u._id}
                  className="appt-row"
                  style={{
                    background: 'var(--bg)',
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  {/* Left: Avatar & Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: badge.bg, color: badge.color, flexShrink: 0 }}>
                      <RoleIcon size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: 'var(--fs-md)' }}>{u.name}</strong>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '1px 8px',
                            borderRadius: '999px',
                            background: badge.bg,
                            color: badge.color,
                            textTransform: 'capitalize'
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div className="stat-label" style={{ marginTop: '0.15rem' }}>
                        {u.email}
                        {u.role === 'student' && u.studentId && ` · ID: ${u.studentId}`}
                        {u.role === 'student' && u.department && ` · Dept: ${u.department}`}
                        {u.role === 'doctor' && u.specialty && ` · Specialty: ${u.specialty}`}
                        {u.role === 'pharmacist' && u.station && ` · Station: ${u.station}`}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      className="slot-btn"
                      title="Edit User"
                      style={{ padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: 'var(--fs-xs)' }}
                      onClick={() => handleOpenEdit(u)}
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      className="slot-btn"
                      title="Reset Password"
                      style={{ padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: 'var(--fs-xs)' }}
                      onClick={() => { setResetPassUser(u); setNewPassword(''); setError(''); setSuccess('') }}
                    >
                      <KeyRound size={13} /> Password
                    </button>
                    <button
                      className="slot-btn"
                      title="Delete User"
                      style={{ padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: 'var(--fs-xs)', color: '#dc2626', borderColor: '#fca5a5' }}
                      onClick={() => { setDeletingUser(u); setError(''); setSuccess('') }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Add User Modal ── */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: 'var(--fs-md)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserPlus size={18} style={{ color: 'var(--accent)' }} /> Add New User
              </h3>
              <button onClick={() => setIsAddOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@unicare.edu"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Password * (min 6 chars)</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Account Role *</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="doctor">Doctor</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Role Fields */}
              {formData.role === 'student' && (
                <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                  <span className="role-info-label" style={{ fontSize: '10px', display: 'block', marginBottom: '0.5rem' }}>STUDENT ATTRIBUTES</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label>Student ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 220042100"
                        value={formData.studentId}
                        onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label>Department</label>
                      <input
                        type="text"
                        placeholder="e.g. CSE"
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label>Program</label>
                      <input
                        type="text"
                        placeholder="e.g. B.Sc. in SWE"
                        value={formData.program}
                        onChange={e => setFormData({ ...formData, program: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label>Age</label>
                      <input
                        type="number"
                        placeholder="e.g. 21"
                        value={formData.age}
                        onChange={e => setFormData({ ...formData, age: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Contact Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +8801711000000"
                      value={formData.contact}
                      onChange={e => setFormData({ ...formData, contact: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {formData.role === 'doctor' && (
                <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                  <span className="role-info-label" style={{ fontSize: '10px', display: 'block', marginBottom: '0.5rem' }}>DOCTOR ATTRIBUTES</span>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Medical Specialty</label>
                    <input
                      type="text"
                      placeholder="e.g. General Physician, Dermatologist"
                      value={formData.specialty}
                      onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {formData.role === 'pharmacist' && (
                <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                  <span className="role-info-label" style={{ fontSize: '10px', display: 'block', marginBottom: '0.5rem' }}>PHARMACIST ATTRIBUTES</span>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Assigned Station / Counter</label>
                    <input
                      type="text"
                      placeholder="e.g. Main Pharmacy Counter 1"
                      value={formData.station}
                      onChange={e => setFormData({ ...formData, station: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="slot-btn" onClick={() => setIsAddOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: 'var(--fs-md)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Edit2 size={18} style={{ color: 'var(--accent)' }} /> Edit User: {editingUser.name}
              </h3>
              <button onClick={() => setEditingUser(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Account Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="doctor">Doctor</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {formData.role === 'student' && (
                <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                  <span className="role-info-label" style={{ fontSize: '10px', display: 'block', marginBottom: '0.5rem' }}>STUDENT ATTRIBUTES</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label>Student ID</label>
                      <input
                        type="text"
                        value={formData.studentId}
                        onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label>Department</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label>Program</label>
                      <input
                        type="text"
                        value={formData.program}
                        onChange={e => setFormData({ ...formData, program: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label>Age</label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={e => setFormData({ ...formData, age: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Contact</label>
                    <input
                      type="text"
                      value={formData.contact}
                      onChange={e => setFormData({ ...formData, contact: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {formData.role === 'doctor' && (
                <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                  <span className="role-info-label" style={{ fontSize: '10px', display: 'block', marginBottom: '0.5rem' }}>DOCTOR ATTRIBUTES</span>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Specialty</label>
                    <input
                      type="text"
                      value={formData.specialty}
                      onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {formData.role === 'pharmacist' && (
                <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                  <span className="role-info-label" style={{ fontSize: '10px', display: 'block', marginBottom: '0.5rem' }}>PHARMACIST ATTRIBUTES</span>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Station</label>
                    <input
                      type="text"
                      value={formData.station}
                      onChange={e => setFormData({ ...formData, station: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="slot-btn" onClick={() => setEditingUser(null)} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {resetPassUser && (
        <div className="modal-overlay" onClick={() => setResetPassUser(null)}>
          <div className="modal-card" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: 'var(--fs-md)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <KeyRound size={18} style={{ color: 'var(--accent)' }} /> Reset Password
              </h3>
              <button onClick={() => setResetPassUser(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-sub)', marginBottom: '1rem' }}>
              Enter a new password for <strong>{resetPassUser.name}</strong> ({resetPassUser.email}).
            </p>

            <form onSubmit={handleResetPassSubmit}>
              <div className="form-group">
                <label>New Password (min 6 characters)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="slot-btn" onClick={() => setResetPassUser(null)} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Resetting…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingUser && (
        <div className="modal-overlay" onClick={() => setDeletingUser(null)}>
          <div className="modal-card" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={18} /> Delete Account
              </h3>
              <button onClick={() => setDeletingUser(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text)', marginBottom: '1.25rem' }}>
              Are you sure you want to permanently delete the account for <strong>{deletingUser.name}</strong> ({deletingUser.email})? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="slot-btn" onClick={() => setDeletingUser(null)} style={{ flex: 1, justifyContent: 'center' }}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-submit"
                style={{ flex: 1, background: '#dc2626', borderColor: '#dc2626' }}
                disabled={submitting}
                onClick={handleDeleteConfirm}
              >
                {submitting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
