const User = require('../models/User')

// GET /api/students?q=   — student picker for the doctor's prescription form
const listStudents = async (req, res, next) => {
  try {
    const filter = { role: 'student' }
    if (req.query.q) {
      const rx = new RegExp(req.query.q, 'i')
      filter.$or = [{ name: rx }, { studentId: rx }]
    }
    const students = await User.find(filter).select('name studentId department age program contact').sort('name')
    res.json(students)
  } catch (err) { next(err) }
}

// GET /api/students/medical-details  — student views own decoded medical details
const getMedicalDetails = async (req, res, next) => {
  try {
    const student = await User.findById(req.user.id)
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' })
    }

    const decodedDetails = student.medicalDetails
      ? Buffer.from(student.medicalDetails, 'base64').toString('utf-8')
      : ''

    res.json({ medicalDetails: decodedDetails })
  } catch (err) { next(err) }
}

// PUT /api/students/medical-details  — student saves own medical details (stored Base64-encoded)
const updateMedicalDetails = async (req, res, next) => {
  try {
    const { medicalDetails } = req.body
    const text = typeof medicalDetails === 'string' ? medicalDetails : ''

    const encoded = text.trim()
      ? Buffer.from(text.trim(), 'utf-8').toString('base64')
      : ''

    const student = await User.findByIdAndUpdate(
      req.user.id,
      { medicalDetails: encoded },
      { new: true }
    )

    const decodedDetails = student.medicalDetails
      ? Buffer.from(student.medicalDetails, 'base64').toString('utf-8')
      : ''

    res.json({ medicalDetails: decodedDetails, message: 'Medical details updated successfully' })
  } catch (err) { next(err) }
}

// GET /api/students/:id/medical-details  — doctor views student's decoded medical details
const getStudentMedicalDetails = async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' })
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    const decodedDetails = student.medicalDetails
      ? Buffer.from(student.medicalDetails, 'base64').toString('utf-8')
      : ''

    res.json({
      studentId: student._id,
      name: student.name,
      medicalDetails: decodedDetails
    })
  } catch (err) { next(err) }
}

module.exports = {
  listStudents,
  getMedicalDetails,
  updateMedicalDetails,
  getStudentMedicalDetails,
}
