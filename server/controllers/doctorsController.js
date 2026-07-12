const User = require('../models/User')

// GET /api/doctors
const listDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('name specialty availability')
    res.json(doctors)
  } catch (err) { next(err) }
}

// PUT /api/doctors/me/availability
const updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body
    if (!Array.isArray(availability))
      return res.status(400).json({ message: 'availability must be an array' })

    for (const slot of availability) {
      const { dayOfWeek, startTime, endTime, slotDurationMinutes } = slot
      if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6)
        return res.status(400).json({ message: 'dayOfWeek must be an integer 0-6' })
      if (typeof startTime !== 'string' || typeof endTime !== 'string' || !startTime || !endTime)
        return res.status(400).json({ message: 'startTime and endTime are required' })
      if (!(startTime < endTime))
        return res.status(400).json({ message: 'startTime must be before endTime' })
      if (!Number.isInteger(slotDurationMinutes) || slotDurationMinutes <= 0)
        return res.status(400).json({ message: 'slotDurationMinutes must be a positive integer' })
    }

    const user = await User.findByIdAndUpdate(req.user.id, { availability }, { new: true }).select('-password')
    res.json(user)
  } catch (err) { next(err) }
}

module.exports = { listDoctors, updateAvailability }
