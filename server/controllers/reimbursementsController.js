const ReimbursementClaim = require('../models/ReimbursementClaim')
const Prescription = require('../models/Prescription')
const User = require('../models/User')
const { sendClaimAssignmentEmail, sendClaimStatusEmail } = require('../utils/mailer')

exports.create = async (req, res, next) => {
  try {
    const { prescriptionId, amount, hospitalName } = req.body

    if (!prescriptionId) {
      return res.status(400).json({ message: 'Prescription ID is required' })
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'A positive amount is required' })
    }
    if (!hospitalName || !hospitalName.trim()) {
      return res.status(400).json({ message: 'Hospital name is required' })
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Bill file upload is required' })
    }

    const prescription = await Prescription.findById(prescriptionId)
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' })
    }

    // Verify prescription belongs to the student
    if (prescription.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: prescription does not belong to you' })
    }

    const billFileUrl = `/uploads/${req.file.filename}`

    const claim = await ReimbursementClaim.create({
      student: req.user.id,
      prescription: prescriptionId,
      doctor: prescription.doctor,
      amount: Number(amount),
      hospitalName: hospitalName.trim(),
      billFileUrl,
      status: 'pending'
    })

    const populatedClaim = await claim.populate([
      { path: 'student', select: 'name email' },
      { path: 'doctor', select: 'name email' }
    ])

    // Send email to assigned doctor
    if (populatedClaim.doctor && populatedClaim.doctor.email) {
      await sendClaimAssignmentEmail(
        populatedClaim.doctor.email,
        populatedClaim.doctor.name,
        populatedClaim.student?.name || 'A student',
        claim.amount,
        claim.hospitalName
      )
    }

    res.status(201).json(populatedClaim)
  } catch (err) {
    next(err)
  }
}

exports.listMine = async (req, res, next) => {
  try {
    let filter = {}
    if (req.user.role === 'student') {
      filter = { student: req.user.id }
    } else if (req.user.role === 'doctor') {
      filter = { doctor: req.user.id }
    }

    const claims = await ReimbursementClaim.find(filter)
      .populate([
        { path: 'student', select: 'name studentId department email' },
        { path: 'doctor', select: 'name specialty email' },
        { path: 'prescription', populate: { path: 'medicines.medicine', select: 'name unit' } }
      ])
      .sort('-createdAt')

    res.json(claims)
  } catch (err) {
    next(err)
  }
}

exports.review = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, reviewNotes } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' })
    }

    const claim = await ReimbursementClaim.findById(id)
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' })
    }

    // Verify reviewer is the assigned doctor
    if (claim.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: you are not the reviewer for this claim' })
    }

    claim.status = status
    claim.reviewNotes = reviewNotes || ''
    await claim.save()

    const populatedClaim = await claim.populate([
      { path: 'student', select: 'name email' },
      { path: 'doctor', select: 'name' }
    ])

    // Send email to student
    if (populatedClaim.student && populatedClaim.student.email) {
      await sendClaimStatusEmail(
        populatedClaim.student.email,
        populatedClaim.student.name,
        claim.amount,
        status,
        populatedClaim.doctor?.name || 'Reviewer',
        claim.reviewNotes
      )
    }

    res.json(populatedClaim)
  } catch (err) {
    next(err)
  }
}
