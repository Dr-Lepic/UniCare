const express      = require('express')
const cors         = require('cors')
const path         = require('path')
require('dotenv').config({ path: '../.env' })

const connectDB         = require('./config/db')
const authRoutes        = require('./routes/auth')
const doctorRoutes      = require('./routes/doctors')
const appointmentRoutes = require('./routes/appointments')
const medicineRoutes    = require('./routes/medicines')
const studentRoutes     = require('./routes/students')
const prescriptionRoutes = require('./routes/prescriptions')
const reimbursementRoutes = require('./routes/reimbursements')
const adminRoutes         = require('./routes/admin')
const errorHandler      = require('./middleware/errorHandler')

const app = express()

connectDB()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/medicines', medicineRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/prescriptions', prescriptionRoutes)
app.use('/api/reimbursements', reimbursementRoutes)
app.use('/api/admin', adminRoutes)

app.get('/', (_, res) => res.send('UniCare API running ✅'))

// Must be last — catches all next(err) calls
app.use(errorHandler)

const PORT = process.env.PORT || 5001
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`))