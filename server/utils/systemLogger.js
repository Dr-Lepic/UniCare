const SystemLog = require('../models/SystemLog')

/**
 * Log a system event asynchronously
 * @param {Object} logData - { action, category, details, performedBy, targetUser, metadata }
 */
const logSystemEvent = async (logData) => {
  try {
    await SystemLog.create({
      ...logData,
      timestamp: new Date()
    })
  } catch (err) {
    console.error('SystemLog creation failed:', err.message)
  }
}

module.exports = { logSystemEvent }
