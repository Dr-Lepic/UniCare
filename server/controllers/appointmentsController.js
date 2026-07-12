const User        = require('../models/User')
const Appointment = require('../models/Appointment')

const ACTIVE_STATUSES = ['pending', 'confirmed', 'completed']

// Parse "YYYY-MM-DD" as a UTC-midnight Date so weekday derivation (getUTCDay)
// never drifts with the server's local timezone.
const parseDate = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00Z`)
  return isNaN(d.getTime()) ? null : d
}

const generateSlots = (availability, dayOfWeek) => {
  const slots = []
  for (const entry of availability) {
    if (entry.dayOfWeek !== dayOfWeek) continue
    const [startH, startM] = entry.startTime.split(':').map(Number)
    const [endH, endM]     = entry.endTime.split(':').map(Number)
    let cursor = startH * 60 + startM
    const end  = endH * 60 + endM
    while (cursor + entry.slotDurationMinutes <= end) {
      const from = cursor
      const to   = cursor + entry.slotDurationMinutes
      const fmt  = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
      slots.push(`${fmt(from)}-${fmt(to)}`)
      cursor = to
    }
  }
  return slots
}

// GET /api/appointments/slots?doctorId=&date=
const getSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query
    if (!doctorId || !date)
      return res.status(400).json({ message: 'doctorId and date are required' })

    const d = parseDate(date)
    if (!d) return res.status(400).json({ message: 'Invalid date' })

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' })
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' })

    const candidates = generateSlots(doctor.availability, d.getUTCDay())

    const taken = await Appointment.find({ doctor: doctorId, date: d, status: { $in: ACTIVE_STATUSES } }).select('timeSlot')
    const takenSet = new Set(taken.map(a => a.timeSlot))

    res.json(candidates.filter(s => !takenSet.has(s)))
  } catch (err) { next(err) }
}

// POST /api/appointments
const book = async (req, res, next) => {
  try {
    const { doctorId, date, timeSlot } = req.body
    if (!doctorId || !date || !timeSlot)
      return res.status(400).json({ message: 'doctorId, date and timeSlot are required' })

    const d = parseDate(date)
    if (!d) return res.status(400).json({ message: 'Invalid date' })

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' })
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' })

    const clash = await Appointment.findOne({ doctor: doctorId, date: d, timeSlot, status: { $in: ACTIVE_STATUSES } })
    if (clash) return res.status(409).json({ message: 'Slot already booked' })

    let appointment
    try {
      appointment = await Appointment.create({ student: req.user.id, doctor: doctorId, date: d, timeSlot })
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ message: 'Slot already booked' })
      throw err
    }

    res.status(201).json(appointment)
  } catch (err) { next(err) }
}

// GET /api/appointments/mine
const listMine = async (req, res, next) => {
  try {
    const filter = req.user.role === 'doctor' ? { doctor: req.user.id } : { student: req.user.id }
    const appointments = await Appointment.find(filter)
      .populate('student doctor', 'name specialty')
      .sort('date')
    res.json(appointments)
  } catch (err) { next(err) }
}

const TRANSITIONS = {
  student: { pending: ['cancelled'], confirmed: ['cancelled'] },
  doctor:  { pending: ['confirmed', 'cancelled'], confirmed: ['completed', 'cancelled'] },
}

// PATCH /api/appointments/:id
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    const appointment = await Appointment.findById(req.params.id)
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' })

    const isOwner = req.user.role === 'doctor'
      ? appointment.doctor.equals(req.user.id)
      : appointment.student.equals(req.user.id)
    if (!isOwner) return res.status(403).json({ message: 'Access denied' })

    const allowed = TRANSITIONS[req.user.role]?.[appointment.status] || []
    if (!allowed.includes(status))
      return res.status(400).json({ message: `Cannot transition from ${appointment.status} to ${status}` })

    appointment.status = status
    await appointment.save()
    res.json(appointment)
  } catch (err) { next(err) }
}

module.exports = { getSlots, book, listMine, updateStatus }
