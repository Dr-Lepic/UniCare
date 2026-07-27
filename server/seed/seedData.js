const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
require('dotenv').config({ path: '../.env' })
const User = require('../models/User')

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/unicare')
  console.log('Connected. Seeding...')

  await User.deleteMany()

  const h = (pw) => bcrypt.hash(pw, 10)

  await User.insertMany([
    { name: 'Dr. Mahbub Rahman', email: 'doctor@unicare.edu',      password: await h('doc123'),     role: 'doctor',      specialty: 'General Medicine' },
    { name: 'Pharmacist Asif',   email: 'pharmacist@unicare.edu',  password: await h('pharma123'),  role: 'pharmacist',  station: 'Main Pharmacy' },
    { name: 'Admin User',        email: 'admin@unicare.edu',       password: await h('admin123'),   role: 'admin' },
    { name: 'Student WMBA',      email: 'student@unicare.edu',     password: await h('student123'), role: 'student',     studentId: 'STU-036', department: 'Computer Science' },
  ])

  console.log('\n✅ Seed complete. Login credentials:')
  console.log('  doctor@unicare.edu       / doc123')
  console.log('  pharmacist@unicare.edu   / pharma123')
  console.log('  admin@unicare.edu        / admin123')
  console.log('  student@unicare.edu      / student123')
  process.exit()
}

seed().catch(e => { console.error(e); process.exit(1) })
