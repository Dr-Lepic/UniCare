const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Appointment = require('../models/Appointment')
const Prescription = require('../models/Prescription')
const ReimbursementClaim = require('../models/ReimbursementClaim')
const Medicine = require('../models/Medicine')
const SystemLog = require('../models/SystemLog')
const { logSystemEvent } = require('../utils/systemLogger')

// GET /api/admin/stats — System-wide aggregate statistics
const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      doctorCount,
      studentCount,
      pharmacistCount,
      adminCount,
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      totalPrescriptions,
      dispensedPrescriptions,
      totalClaims,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      medicines,
      recentLogs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'pharmacist' }),
      User.countDocuments({ role: 'admin' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'completed' }),
      Prescription.countDocuments(),
      Prescription.countDocuments({ status: 'dispensed' }),
      ReimbursementClaim.countDocuments(),
      ReimbursementClaim.countDocuments({ status: 'pending' }),
      ReimbursementClaim.countDocuments({ status: 'approved' }),
      ReimbursementClaim.countDocuments({ status: 'rejected' }),
      Medicine.find({}).select('stockQty reorderThreshold'),
      SystemLog.find({})
        .populate('performedBy', 'name role')
        .populate('targetUser', 'name role')
        .sort('-timestamp')
        .limit(10)
    ])

    const lowStockCount = medicines.filter(m => m.stockQty <= m.reorderThreshold).length

    res.json({
      users: {
        total: totalUsers,
        doctors: doctorCount,
        students: studentCount,
        pharmacists: pharmacistCount,
        admins: adminCount
      },
      appointments: {
        total: totalAppointments,
        pending: pendingAppointments,
        completed: completedAppointments
      },
      prescriptions: {
        total: totalPrescriptions,
        dispensed: dispensedPrescriptions,
        pendingCollection: totalPrescriptions - dispensedPrescriptions
      },
      claims: {
        total: totalClaims,
        pending: pendingClaims,
        approved: approvedClaims,
        rejected: rejectedClaims
      },
      inventory: {
        totalMedicines: medicines.length,
        lowStockAlerts: lowStockCount
      },
      recentActivity: recentLogs
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/admin/users — List & search all users
const listUsers = async (req, res, next) => {
  try {
    const { role, q } = req.query
    const filter = {}

    if (role && ['student', 'doctor', 'pharmacist', 'admin'].includes(role)) {
      filter.role = role
    }

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i')
      filter.$or = [
        { name: regex },
        { email: regex },
        { studentId: regex },
        { department: regex },
        { specialty: regex }
      ]
    }

    const users = await User.find(filter)
      .select('-password')
      .sort('-createdAt')

    res.json(users)
  } catch (err) {
    next(err)
  }
}

// GET /api/admin/users/:id — Get user details
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json(user)
  } catch (err) {
    next(err)
  }
}

// POST /api/admin/users — Create new user
const createUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      studentId,
      department,
      age,
      program,
      contact,
      specialty,
      availability,
      station
    } = req.body

    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' })
    if (!email || !email.trim()) return res.status(400).json({ message: 'Email is required' })
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })
    if (!role || !['student', 'doctor', 'pharmacist', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Valid role (student, doctor, pharmacist, admin) is required' })
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role
    }

    if (role === 'student') {
      if (studentId) userData.studentId = studentId.trim()
      if (department) userData.department = department.trim()
      if (program) userData.program = program.trim()
      if (age) userData.age = Number(age)
      if (contact) userData.contact = contact.trim()
    } else if (role === 'doctor') {
      userData.specialty = (specialty && specialty.trim()) || 'General Physician'
      if (Array.isArray(availability)) {
        userData.availability = availability
      } else {
        // Default availability: Mon-Thu 09:00 - 17:00
        userData.availability = [0, 1, 2, 3, 4].map(d => ({
          dayOfWeek: d,
          startTime: '09:00',
          endTime: '17:00',
          slotDurationMinutes: 30
        }))
      }
    } else if (role === 'pharmacist') {
      userData.station = (station && station.trim()) || 'Main Pharmacy Counter'
    }

    const newUser = await User.create(userData)
    const userResponse = newUser.toObject()
    delete userResponse.password

    await logSystemEvent({
      action: 'user_created',
      category: 'user',
      details: `Created new ${role} account for ${newUser.name} (${newUser.email})`,
      performedBy: req.user.id,
      targetUser: newUser._id
    })

    res.status(201).json(userResponse)
  } catch (err) {
    next(err)
  }
}

// PUT /api/admin/users/:id — Update user profile
const updateUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      role,
      studentId,
      department,
      age,
      program,
      contact,
      specialty,
      station
    } = req.body

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const conflict = await User.findOne({ email: email.toLowerCase().trim() })
      if (conflict) {
        return res.status(409).json({ message: 'Email address is already in use by another user' })
      }
      user.email = email.toLowerCase().trim()
    }

    if (name && name.trim()) user.name = name.trim()
    if (role && ['student', 'doctor', 'pharmacist', 'admin'].includes(role)) {
      user.role = role
    }

    // Role-specific fields
    if (studentId !== undefined) user.studentId = studentId
    if (department !== undefined) user.department = department
    if (program !== undefined) user.program = program
    if (age !== undefined) user.age = age ? Number(age) : undefined
    if (contact !== undefined) user.contact = contact
    if (specialty !== undefined) user.specialty = specialty
    if (station !== undefined) user.station = station

    await user.save()

    const userResponse = user.toObject()
    delete userResponse.password

    await logSystemEvent({
      action: 'user_updated',
      category: 'user',
      details: `Updated details for ${user.name} (${user.email})`,
      performedBy: req.user.id,
      targetUser: user._id
    })

    res.json(userResponse)
  } catch (err) {
    next(err)
  }
}

// DELETE /api/admin/users/:id — Delete a user
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Administrators cannot delete their own account' })
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    await User.findByIdAndDelete(req.params.id)

    await logSystemEvent({
      action: 'user_deleted',
      category: 'user',
      details: `Deleted ${user.role} account: ${user.name} (${user.email})`,
      performedBy: req.user.id
    })

    res.json({ message: `User ${user.name} deleted successfully` })
  } catch (err) {
    next(err)
  }
}

// PUT /api/admin/users/:id/reset-password — Admin resets password for user
const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' })
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    await logSystemEvent({
      action: 'password_reset',
      category: 'auth',
      details: `Admin reset password for user ${user.name} (${user.email})`,
      performedBy: req.user.id,
      targetUser: user._id
    })

    res.json({ message: `Password for ${user.name} has been reset successfully` })
  } catch (err) {
    next(err)
  }
}

// GET /api/admin/logs — List system audit logs
const listLogs = async (req, res, next) => {
  try {
    const { category, action, limit = 50 } = req.query
    const filter = {}

    if (category) filter.category = category
    if (action) filter.action = action

    const logs = await SystemLog.find(filter)
      .populate('performedBy', 'name email role')
      .populate('targetUser', 'name email role')
      .sort('-timestamp')
      .limit(Number(limit))

    res.json(logs)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getStats,
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  listLogs
}
