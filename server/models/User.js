const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'doctor', 'nurse'],
      required: true,
    },

    // Student-specific
    studentId: { type: String },
    department: { type: String },

    // Doctor-specific
    specialty: { type: String },

    // Nurse-specific
    station: { type: String },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)