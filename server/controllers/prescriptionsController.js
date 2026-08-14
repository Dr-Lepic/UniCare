const crypto       = require('crypto')
const User         = require('../models/User')
const Medicine     = require('../models/Medicine')
const Prescription = require('../models/Prescription')
const OTP          = require('../models/OTP')
const InventoryLog = require('../models/InventoryLog')
const { sendOTPEmail } = require('../utils/mailer')
const { logSystemEvent } = require('../utils/systemLogger')

const SHARE_TTL_DAYS = 30

const POPULATE = [
  { path: 'student', select: 'name studentId department email' },
  { path: 'doctor',  select: 'name specialty' },
  { path: 'medicines.medicine', select: 'name unit stockQty' },
]

// Public read-only "sick-leave" view. No student/doctor identifiers beyond names.
const publicView = (p) => ({
  id: p._id,
  createdAt: p.createdAt,
  doctor: p.doctor && { name: p.doctor.name, specialty: p.doctor.specialty },
  student: p.student && { name: p.student.name, studentId: p.student.studentId },
  symptoms: p.symptoms,
  diagnosis: p.diagnosis,
  tests: p.tests,
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
    const { studentId, appointmentId, symptoms, diagnosis, tests, medicines, notes } = req.body

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
      symptoms,
      diagnosis,
      tests,
      medicines: lineItems,
      notes,
    })

    const populated = await prescription.populate(POPULATE)

    // Generate a 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry

    await OTP.create({
      prescription: prescription._id,
      student: student._id,
      code,
      expiresAt
    })

    // Email OTP asynchronously
    const medicinesDetails = populated.medicines.map(m => ({
      name: m.medicine?.name || 'Unknown Medicine',
      dosage: m.dosage,
      qty: m.qty,
      unit: m.medicine?.unit
    }))
    sendOTPEmail(student.email, student.name, code, medicinesDetails)

    await logSystemEvent({
      action: 'prescription_created',
      category: 'clinical',
      details: `Prescription issued for student ${student.name} (${student.studentId || ''}) by Dr. ${req.user.name || 'Doctor'}`,
      performedBy: req.user.id,
      targetUser: student._id
    })

    res.status(201).json(populated)
  } catch (err) { next(err) }
}

// GET /api/prescriptions/mine   — student: received; doctor: authored
const listMine = async (req, res, next) => {
  try {
    const filter = req.user.role === 'doctor' ? { doctor: req.user.id } : { student: req.user.id }
    const prescriptions = await Prescription.find(filter).populate(POPULATE).sort('-createdAt')
    
    if (req.user.role === 'student') {
      const plainPrescriptions = prescriptions.map(p => p.toObject())
      for (const p of plainPrescriptions) {
        if (p.status !== 'dispensed') {
          const otp = await OTP.findOne({ prescription: p._id, used: false, expiresAt: { $gt: new Date() } })
          if (otp) {
            p.otpCode = otp.code
            p.otpExpiresAt = otp.expiresAt
          }
        }
      }
      return res.json(plainPrescriptions)
    }

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

// POST /api/prescriptions/otp/verify   — pharmacist only
const verifyOTP = async (req, res, next) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ message: 'OTP code is required' })

    const otp = await OTP.findOne({ code, used: false, expiresAt: { $gt: new Date() } })
    if (!otp) return res.status(404).json({ message: 'Invalid or expired OTP code' })

    const prescription = await Prescription.findById(otp.prescription).populate(POPULATE)
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' })

    if (prescription.status === 'dispensed') {
      return res.status(400).json({ message: 'This prescription has already been dispensed' })
    }

    res.json({
      otpCode: otp.code,
      expiresAt: otp.expiresAt,
      prescription
    })
  } catch (err) { next(err) }
}

// POST /api/prescriptions/otp/dispense   — pharmacist only
const dispensePrescription = async (req, res, next) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ message: 'OTP code is required' })

    const otp = await OTP.findOne({ code, used: false, expiresAt: { $gt: new Date() } })
    if (!otp) return res.status(404).json({ message: 'Invalid or expired OTP code' })

    const prescription = await Prescription.findById(otp.prescription)
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' })

    if (prescription.status === 'dispensed') {
      return res.status(400).json({ message: 'This prescription has already been dispensed' })
    }

    // Check stock for all medicines first
    for (const item of prescription.medicines) {
      const med = await Medicine.findById(item.medicine)
      if (!med) return res.status(404).json({ message: 'One or more medicines in prescription not found in inventory' })
      if (med.stockQty < item.qty) {
        return res.status(400).json({ message: `Insufficient stock for ${med.name}. Prescribed: ${item.qty}, In stock: ${med.stockQty}` })
      }
    }

    // Decrement stock & Log
    for (const item of prescription.medicines) {
      await Medicine.findByIdAndUpdate(item.medicine, { $inc: { stockQty: -item.qty } })
      await InventoryLog.create({
        medicine: item.medicine,
        changeQty: -item.qty,
        reason: 'dispensed',
        performedBy: req.user.id
      })
    }

    // Mark OTP as used and prescription as dispensed
    otp.used = true
    await otp.save()

    prescription.status = 'dispensed'
    await prescription.save()

    await logSystemEvent({
      action: 'prescription_dispensed',
      category: 'pharmacy',
      details: `Prescription #${prescription._id.toString().slice(-6)} dispensed by Pharmacist`,
      performedBy: req.user.id,
      targetUser: prescription.student
    })

    res.json({ message: 'Prescription dispensed successfully', prescriptionId: prescription._id })
  } catch (err) { next(err) }
}

module.exports = { viewShared, create, listMine, getOne, share, verifyOTP, dispensePrescription }
