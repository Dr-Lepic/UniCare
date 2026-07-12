const mongoose = require('mongoose')

const lineItemSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    dosage:   { type: String, required: true }, // free text, e.g. "1 tablet twice daily after meals"
    qty:      { type: Number, required: true, min: 1 },
  },
  { _id: false }
)

const prescriptionSchema = new mongoose.Schema(
  {
    doctor:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    student:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }, // optional (standalone Rx)
    medicines:   { type: [lineItemSchema], validate: v => v.length > 0 },
    notes:       { type: String },

    // Shareable "sick-leave" link (Milestone 4). Sparse so unshared prescriptions don't collide on null.
    shareToken:          { type: String, index: { unique: true, sparse: true } },
    shareTokenExpiresAt: { type: Date },

    // Medicine collection status (Milestone 5)
    status:              { type: String, enum: ['pending', 'dispensed'], default: 'pending' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Prescription', prescriptionSchema)
