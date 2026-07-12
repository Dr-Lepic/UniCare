const router = require('express').Router()
const { listDoctors, updateAvailability } = require('../controllers/doctorsController')
const { protect, allowRoles } = require('../middleware/auth')

router.use(protect)

router.get('/',                listDoctors)
router.put('/me/availability', allowRoles('doctor'), updateAvailability)

module.exports = router
