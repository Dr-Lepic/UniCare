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

    // Doctor-specific
    specialty:  String,

    // Pharmacist-specific
    station:    String,
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)