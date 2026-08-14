const mongoose = require('mongoose')

const systemLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'user_created',
        'user_updated',
        'user_deleted',
        'password_reset',
        'login',
        'appointment_created',
        'appointment_status_changed',
        'prescription_created',
        'prescription_dispensed',
        'claim_submitted',
        'claim_reviewed',
        'medicine_created',
        'medicine_restocked',
        'medicine_updated'
      ]
    },
    category: {
      type: String,
      enum: ['auth', 'user', 'clinical', 'pharmacy', 'reimbursement'],
      default: 'user'
    },
    details: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('SystemLog', systemLogSchema)
