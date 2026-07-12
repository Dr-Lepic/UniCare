const mongoose = require('mongoose')

const inventoryLogSchema = new mongoose.Schema(
  {
    medicine:    { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    changeQty:   { type: Number, required: true }, // e.g., negative for dispensing, positive for restocks
    reason:      { type: String, enum: ['dispensed', 'restocked'], required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp:   { type: Date, default: Date.now }
  }
)

module.exports = mongoose.model('InventoryLog', inventoryLogSchema)
