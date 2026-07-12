const mongoose = require('mongoose')

const appointmentSchema = new mongoose.Schema(
  {
    student:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:     { type: Date, required: true },   // UTC-midnight calendar day, no time component
    timeSlot: { type: String, required: true }, // e.g. "09:00-09:30"
    status:   { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
)

// Prevent double-booking the same doctor/date/timeSlot (backstop for race conditions;
// controller does a friendlier pre-check first)
appointmentSchema.index(
  { doctor: 1, date: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'confirmed', 'completed'] } } }
)

module.exports = mongoose.model('Appointment', appointmentSchema)
