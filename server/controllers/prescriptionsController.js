const crypto       = require('crypto')
const User         = require('../models/User')
const Medicine     = require('../models/Medicine')
const Prescription = require('../models/Prescription')

const SHARE_TTL_DAYS = 30

const POPULATE = [
  { path: 'student', select: 'name studentId department' },
  { path: 'doctor',  select: 'name specialty' },
  { path: 'medicines.medicine', select: 'name unit stockQty' },
]

// Public read-only "sick-leave" view. No student/doctor identifiers beyond names.
const publicView = (p) => ({
  id: p._id,
  createdAt: p.createdAt,
  doctor: p.doctor && { name: p.doctor.name, specialty: p.doctor.specialty },
  student: p.student && { name: p.student.name, studentId: p.student.studentId },
  notes: p.notes,
  medicines: p.medicines.map(m => ({ name: m.medicine?.name, unit: m.medicine?.unit, dosage: m.dosage, qty: m.qty })),
})

// GET /api/prescriptions/share/:token   — PUBLIC (no auth)
const viewShared = async (req, res, next) => {
  try {
    const p = await Prescription.findOne({ shareToken: req.params.token }).populate(POPULATE)
    if (!p) return res.status(404).json({ message: 'This prescription link is invalid.' })
    if (!p.shareTokenExpiresAt || p.shareTokenExpiresAt < new Date())
      return res.status(410).json({ message: 'This prescription link has expired.' })
    res.json(publicView(p))
  } catch (err) { next(err) }
}

// POST /api/prescriptions   — doctor only
const create = async (req, res, next) => {
  try {
    const { studentId, appointmentId, medicines, notes } = req.body

    const student = await User.findOne({ _id: studentId, role: 'student' })
    if (!student) return res.status(404).json({ message: 'Student not found' })

    if (!Array.isArray(medicines) || medicines.length === 0)
      return res.status(400).json({ message: 'At least one medicine is required' })

    const lineItems = []
    for (const item of medicines) {
      const { medicineId, dosage, qty } = item
      if (!dosage || !Number.isInteger(qty) || qty < 1)
        return res.status(400).json({ message: 'Each medicine needs a dosage and a quantity of at least 1' })
      const med = await Medicine.findById(medicineId)
      if (!med) return res.status(404).json({ message: `Medicine not found: ${medicineId}` })
      lineItems.push({ medicine: med._id, dosage, qty })
    }

    const prescription = await Prescription.create({
      doctor: req.user.id,
      student: student._id,
      appointment: appointmentId || undefined,
      medicines: lineItems,
      notes,
    })

    const populated = await prescription.populate(POPULATE)
    res.status(201).json(populated)
  } catch (err) { next(err) }
}

// GET /api/prescriptions/mine   — student: received; doctor: authored
const listMine = async (req, res, next) => {
  try {
    const filter = req.user.role === 'doctor' ? { doctor: req.user.id } : { student: req.user.id }
    const prescriptions = await Prescription.find(filter).populate(POPULATE).sort('-createdAt')
    res.json(prescriptions)
  } catch (err) { next(err) }
}

const isOwner = (p, user) =>
  user.role === 'doctor' ? p.doctor.equals(user.id) : p.student.equals(user.id)

// GET /api/prescriptions/:id   — owner only
const getOne = async (req, res, next) => {
  try {
    const p = await Prescription.findById(req.params.id).populate(POPULATE)
    if (!p) return res.status(404).json({ message: 'Prescription not found' })
    if (!isOwner(p, req.user)) return res.status(403).json({ message: 'Access denied' })
    res.json(p)
  } catch (err) { next(err) }
}

// POST /api/prescriptions/:id/share   — owner generates/refreshes the public link
const share = async (req, res, next) => {
  try {
    const p = await Prescription.findById(req.params.id)
    if (!p) return res.status(404).json({ message: 'Prescription not found' })
    if (!isOwner(p, req.user)) return res.status(403).json({ message: 'Access denied' })

    p.shareToken = crypto.randomBytes(24).toString('hex')
    p.shareTokenExpiresAt = new Date(Date.now() + SHARE_TTL_DAYS * 24 * 60 * 60 * 1000)
    await p.save()

    res.json({ token: p.shareToken, expiresAt: p.shareTokenExpiresAt })
  } catch (err) { next(err) }
}

module.exports = { viewShared, create, listMine, getOne, share }
