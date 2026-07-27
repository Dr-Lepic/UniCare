const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  email:     { type: String, required: true },
  otp:       { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used:      { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model('PasswordResetOTP', schema)
