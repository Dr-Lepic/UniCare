const router = require('express').Router()
const { listMedicines, create, restock, updateSettings, listLogs } = require('../controllers/medicinesController')
const { protect, allowRoles } = require('../middleware/auth')

router.use(protect)

router.get('/', listMedicines)
router.get('/logs', allowRoles('pharmacist', 'admin'), listLogs)
router.post('/', allowRoles('pharmacist', 'admin'), create)
router.post('/:id/restock', allowRoles('pharmacist', 'admin'), restock)
router.patch('/:id', allowRoles('pharmacist', 'admin'), updateSettings)

module.exports = router
