const router = require('express').Router()
const { listMedicines } = require('../controllers/medicinesController')
const { protect } = require('../middleware/auth')

router.use(protect)

router.get('/', listMedicines)

module.exports = router
