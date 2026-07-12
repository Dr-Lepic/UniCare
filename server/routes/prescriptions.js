const router = require('express').Router()
const { viewShared, create, listMine, getOne, share, verifyOTP, dispensePrescription } = require('../controllers/prescriptionsController')
const { protect, allowRoles } = require('../middleware/auth')

// Public — registered BEFORE protect so the shared "sick-leave" link needs no auth.
router.get('/share/:token', viewShared)

router.use(protect)

router.post('/',            allowRoles('doctor'), create)
router.get('/mine',         listMine)
router.post('/otp/verify',   allowRoles('pharmacist'), verifyOTP)
router.post('/otp/dispense', allowRoles('pharmacist'), dispensePrescription)
router.get('/:id',          getOne)
router.post('/:id/share',    share)

module.exports = router
