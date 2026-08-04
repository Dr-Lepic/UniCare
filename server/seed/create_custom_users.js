const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
const path     = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })
const User     = require('../models/User')

const newUsers = [
  {
    name: 'Mohammod Mahbub',
    email: 'mahbubrahman@iut-dhaka.edu',
    password: '123456789',
    role: 'student',
    studentId: '220042148',
    department: 'CSE',
    program: 'BSc. in SWE',
    age: 22,
    contact: '+8801711000000',
  },
  {
    name: 'Dr. Abdul Kamal',
    email: 'mbmahbub007@gmail.com',
    password: '123456789',
    role: 'doctor',
    specialty: 'General Physician',
    availability: [
      { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 }, // Sun
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 }, // Mon
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 }, // Tue
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 }, // Wed
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 }, // Thu
    ],
  },
  {
    name: 'Jamal Khan',
    email: 'mohammodmahbub48@gmail.com',
    password: '123456789',
    role: 'pharmacist',
    station: 'Pharmacy Counter 1',
  },
  {
    name: 'Admin48',
    email: 'lepicator@gmail.com',
    password: '123456789',
    role: 'admin',
  },
]

const main = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/unicare'
    console.log(`Connecting to MongoDB at ${mongoUri}...`)
    await mongoose.connect(mongoUri)

    for (const uData of newUsers) {
      const existing = await User.findOne({ email: uData.email })
      const hash = await bcrypt.hash(uData.password, 10)
      
      if (existing) {
        Object.assign(existing, uData, { password: hash })
        await existing.save()
        console.log(`Updated user: ${uData.name} (${uData.email}) [${uData.role}]`)
      } else {
        await User.create({ ...uData, password: hash })
        console.log(`Created user: ${uData.name} (${uData.email}) [${uData.role}]`)
      }
    }

    console.log('✅ All requested users successfully created/updated.')
    process.exit(0)
  } catch (err) {
    console.error('❌ Error creating users:', err)
    process.exit(1)
  }
}

main()
