const jwt    = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User   = require('../models/User')
const { logSystemEvent } = require('../utils/systemLogger')

const sign    = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
const safeUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role })

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, studentId, department, specialty, station } = req.body
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'name, email, password and role are required' })

    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'Email already registered' })

    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hash, role, studentId, department, specialty, station })

    await logSystemEvent({
      action: 'user_created',
      category: 'auth',
      details: `User registered: ${user.name} (${user.role})`,
      performedBy: user._id,
      targetUser: user._id
    })

    res.status(201).json({ token: sign(user), user: safeUser(user) })
  } catch (err) { next(err) }
}

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' })

    const user = await User.findOne({ email })
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid email or password' })

    await logSystemEvent({
      action: 'login',
      category: 'auth',
      details: `${user.name} (${user.role}) signed in to portal`,
      performedBy: user._id,
      targetUser: user._id
    })

    res.json({ token: sign(user), user: safeUser(user) })
  } catch (err) { next(err) }
}

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) { next(err) }
}

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Both old and new passwords are required' })
    }

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/
    if (!pwdRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters and include uppercase, lowercase, and a number.'
      })
    }

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect previous password' })
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    res.json({ message: 'Password updated successfully' })
  } catch (err) { next(err) }
}

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60000) // 10 mins

    const PasswordResetOTP = require('../models/PasswordResetOTP')
    await PasswordResetOTP.create({ email, otp, expiresAt })

    const sendEmail = require('../utils/sendEmail')
    await sendEmail(email, 'Password Reset OTP', `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`)

    res.json({ message: 'OTP sent to email' })
  } catch (err) { next(err) }
}

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body
    if (!email || !otp || !newPassword) return res.status(400).json({ message: 'All fields are required' })

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/
    if (!pwdRegex.test(newPassword)) {
      return res.status(400).json({ message: 'New password must be at least 6 chars and include uppercase, lowercase, and a number.' })
    }

    const PasswordResetOTP = require('../models/PasswordResetOTP')
    const validOtp = await PasswordResetOTP.findOne({ email, otp, used: false, expiresAt: { $gt: new Date() } })
    if (!validOtp) return res.status(400).json({ message: 'Invalid or expired OTP' })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    validOtp.used = true
    await validOtp.save()

    res.json({ message: 'Password reset successfully' })
  } catch (err) { next(err) }
}

module.exports = { register, login, getMe, changePassword, forgotPassword, resetPassword }
