// Run this with: node seed/seed.js
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const User = require('../models/User')

const seedUsers = [
  // ---------- Students ----------
  {
    name: 'Rafiq Ahmed',
    email: 'student1@iut-dhaka.edu',
    password: '123456',
    role: 'student',
    studentId: '200041101',
    department: 'CSE',
  },
  {
    name: 'Mim Akter',
    email: 'student2@iut-dhaka.edu',
    password: '123456',
    role: 'student',
    studentId: '200041102',
    department: 'EEE',
  },

  // ---------- Doctors ----------
  {
    name: 'Dr. Kamal Hossain',
    email: 'doctor1@iut-dhaka.edu',
    password: '123456',
    role: 'doctor',
    specialty: 'General Physician',
  },
  {
    name: 'Dr. Nusrat Jahan',
    email: 'doctor2@iut-dhaka.edu',
    password: '123456',
    role: 'doctor',
    specialty: 'Dermatologist',
  },

  // ---------- Nurses ----------
  {
    name: 'Nurse Shirin Begum',
    email: 'nurse1@iut-dhaka.edu',
    password: '123456',
    role: 'nurse',
    station: 'Pharmacy Counter 1',
  },
]

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB connected for seeding')

    await User.deleteMany({}) // clear existing users
    console.log('Old users removed')

    for (const userData of seedUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      await User.create({ ...userData, password: hashedPassword })
    }

    console.log(`${seedUsers.length} users seeded successfully`)
    process.exit(0)
  } catch (err) {
    console.error('Seeding failed:', err)
    process.exit(1)
  }
}

runSeed()