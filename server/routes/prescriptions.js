const router = require('express').Router()
const { viewShared, create, listMine, getOne, share } = require('../controllers/prescriptionsController')
const { protect, allowRoles } = require('../middleware/auth')

// Public — registered BEFORE protect so the shared "sick-leave" link needs no auth.
router.get('/share/:token', viewShared)

router.use(protect)

router.post('/',        allowRoles('doctor'), create)
router.get('/mine',     listMine)
router.get('/:id',      getOne)
router.post('/:id/share', share)

module.exports = router
