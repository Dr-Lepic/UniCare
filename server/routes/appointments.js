const router = require('express').Router()
const { getSlots, book, listMine, updateStatus } = require('../controllers/appointmentsController')
const { protect, allowRoles } = require('../middleware/auth')

router.use(protect)

router.get('/slots', getSlots)
router.post('/',     allowRoles('student'), book)
router.get('/mine',  listMine)
router.patch('/:id', updateStatus)

module.exports = router
