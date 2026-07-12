const User = require('../models/User')

// GET /api/students?q=   — student picker for the doctor's prescription form
const listStudents = async (req, res, next) => {
  try {
    const filter = { role: 'student' }
    if (req.query.q) {
      const rx = new RegExp(req.query.q, 'i')
      filter.$or = [{ name: rx }, { studentId: rx }]
    }
    const students = await User.find(filter).select('name studentId department').sort('name')
    res.json(students)
  } catch (err) { next(err) }
}

module.exports = { listStudents }
