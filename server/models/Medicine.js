const mongoose = require('mongoose')

// Pharmacy stock. Read-only in Milestone 3 (live lookup while writing a prescription);
// stock is decremented on dispensing in Milestone 5.
const medicineSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true, unique: true, trim: true },
    stockQty:         { type: Number, required: true, default: 0, min: 0 },
    unit:             { type: String, default: 'unit' }, // e.g. "tablet", "ml", "sachet"
    reorderThreshold: { type: Number, default: 10, min: 0 }, // low-stock alerts computed on read (M7)
    lastRestockedAt:  { type: Date },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Medicine', medicineSchema)
