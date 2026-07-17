const mongoose = require('mongoose')

const reimbursementClaimSchema = new mongoose.Schema(
  {
    student:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
    doctor:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Derived reviewer doctor
    amount:       { type: Number, required: true, min: 0.01 },
    hospitalName: { type: String, required: true },
    billFileUrl:  { type: String, required: true },
    status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewNotes:  { type: String },
  },
  { timestamps: true }
)

module.exports = mongoose.model('ReimbursementClaim', reimbursementClaimSchema)
