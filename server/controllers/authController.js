const jwt    = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User   = require('../models/User')

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

module.exports = { register, login, getMe }