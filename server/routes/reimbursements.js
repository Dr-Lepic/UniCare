const router = require('express').Router()
const { create, listMine, review } = require('../controllers/reimbursementsController')
const { protect, allowRoles } = require('../middleware/auth')
const upload = require('../middleware/upload')

router.use(protect)

// POST /api/reimbursements (student only)
router.post('/', allowRoles('student'), upload.single('bill'), create)

// GET /api/reimbursements/mine (student or doctor)
router.get('/mine', listMine)

// PATCH /api/reimbursements/:id/review (doctor only)
router.patch('/:id/review', allowRoles('doctor'), review)

module.exports = router
