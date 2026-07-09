// Run: node seed/seed.js
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
require('dotenv').config({ path: '../.env' })
const User = require('../models/User')

const seedUsers = [
  { name: 'Dr. Kamal Hossain', email: 'doctor1@unicare.edu',     password: '123456', role: 'doctor',      specialty: 'General Physician' },
  { name: 'Dr. Nusrat Jahan',  email: 'doctor2@unicare.edu',     password: '123456', role: 'doctor',      specialty: 'Dermatologist' },
  { name: 'Pharmacist Shirin', email: 'pharmacist1@unicare.edu', password: '123456', role: 'pharmacist',  station: 'Pharmacy Counter 1' },
  { name: 'Admin User',        email: 'admin@unicare.edu',       password: '123456', role: 'admin' },
  { name: 'Rafiq Ahmed',       email: 'student1@unicare.edu',    password: '123456', role: 'student',     studentId: '200041101', department: 'CSE' },
  { name: 'Mim Akter',         email: 'student2@unicare.edu',    password: '123456', role: 'student',     studentId: '200041102', department: 'EEE' },
]

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/unicare')
    console.log('MongoDB connected')

    await User.deleteMany({})
    for (const u of seedUsers) {
      await User.create({ ...u, password: await bcrypt.hash(u.password, 10) })
    }

    console.log(`✅ ${seedUsers.length} users seeded`)
    console.log('All passwords: 123456')
    process.exit(0)
  } catch (err) {
    console.error('Seeding failed:', err)
    process.exit(1)
  }
}

runSeed()