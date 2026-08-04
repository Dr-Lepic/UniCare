const router = require('express').Router()
const {
  listStudents,
  getMedicalDetails,
  updateMedicalDetails,
  getStudentMedicalDetails,
} = require('../controllers/studentsController')
const { protect, allowRoles } = require('../middleware/auth')

router.use(protect)

router.get('/', allowRoles('doctor'), listStudents)
router.get('/medical-details', allowRoles('student'), getMedicalDetails)
router.put('/medical-details', allowRoles('student'), updateMedicalDetails)
router.get('/:id/medical-details', allowRoles('doctor'), getStudentMedicalDetails)

module.exports = router
