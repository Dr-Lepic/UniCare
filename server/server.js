const express      = require('express')
const cors         = require('cors')
require('dotenv').config({ path: '../.env' })

const connectDB      = require('./config/db')
const authRoutes     = require('./routes/auth')
const errorHandler   = require('./middleware/errorHandler')

const app = express()

connectDB()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)

app.get('/', (_, res) => res.send('UniCare API running ✅'))

// Must be last — catches all next(err) calls
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`))