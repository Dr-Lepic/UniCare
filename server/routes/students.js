const router = require('express').Router()
const { listStudents } = require('../controllers/studentsController')
const { protect, allowRoles } = require('../middleware/auth')

router.use(protect)

router.get('/', allowRoles('doctor'), listStudents)

module.exports = router
