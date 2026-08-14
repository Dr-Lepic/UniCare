const router = require('express').Router()
const {
  getStats,
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  listLogs
} = require('../controllers/adminController')
const { protect, allowRoles } = require('../middleware/auth')

// Guard all admin endpoints
router.use(protect, allowRoles('admin'))

// Statistics
router.get('/stats', getStats)

// User Management
router.get('/users', listUsers)
router.post('/users', createUser)
router.get('/users/:id', getUser)
router.put('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)
router.put('/users/:id/reset-password', resetUserPassword)

// Audit Logs
router.get('/logs', listLogs)

module.exports = router
