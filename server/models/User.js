const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true },
    email:      { type: String, required: true, unique: true, lowercase: true },
    password:   { type: String, required: true },
    role:       { type: String, enum: ['student', 'doctor', 'pharmacist', 'admin'], required: true },

    // Student-specific
    studentId:  String,
    department: String,
    age:        Number,
    program:    String,
    contact:    String,
    medicalDetails: String, // Base64 encoded string stored in DB

    // Doctor-specific
    specialty:  String,
    availability: [{
      dayOfWeek:           { type: Number, min: 0, max: 6, required: true }, // 0=Sun..6=Sat
      startTime:           { type: String, required: true }, // "HH:MM"
      endTime:             { type: String, required: true }, // "HH:MM"
      slotDurationMinutes: { type: Number, required: true },
    }],

    // Pharmacist-specific
    station:    String,
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)