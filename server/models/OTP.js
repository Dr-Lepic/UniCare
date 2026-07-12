const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema(
  {
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
    student:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    code:         { type: String, required: true },
    expiresAt:    { type: Date, required: true },
    used:         { type: Boolean, default: false },
  },
  { timestamps: true }
)

module.exports = mongoose.model('OTP', otpSchema)
