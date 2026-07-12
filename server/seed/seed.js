// Run: node seed/seed.js
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
require('dotenv').config({ path: '../.env' })
const User     = require('../models/User')
const Medicine = require('../models/Medicine')

const seedUsers = [
  { name: 'Dr. Kamal Hossain', email: 'doctor1@unicare.edu',     password: '123456', role: 'doctor',      specialty: 'General Physician' },
  { name: 'Dr. Nusrat Jahan',  email: 'doctor2@unicare.edu',     password: '123456', role: 'doctor',      specialty: 'Dermatologist' },
  { name: 'Pharmacist Shirin', email: 'pharmacist1@unicare.edu', password: '123456', role: 'pharmacist',  station: 'Pharmacy Counter 1' },
  { name: 'Admin User',        email: 'admin@unicare.edu',       password: '123456', role: 'admin' },
  { name: 'Rafiq Ahmed',       email: 'student1@unicare.edu',    password: '123456', role: 'student',     studentId: '200041101', department: 'CSE' },
  { name: 'Mim Akter',         email: 'student2@unicare.edu',    password: '123456', role: 'student',     studentId: '200041102', department: 'EEE' },
]

const seedMedicines = [
  { name: 'Paracetamol 500mg', stockQty: 240, unit: 'tablet', reorderThreshold: 50 },
  { name: 'Amoxicillin 500mg', stockQty: 40,  unit: 'capsule', reorderThreshold: 30 },
  { name: 'Ibuprofen 400mg',   stockQty: 120, unit: 'tablet', reorderThreshold: 40 },
  { name: 'Cetirizine 10mg',   stockQty: 8,   unit: 'tablet', reorderThreshold: 20 },
  { name: 'Omeprazole 20mg',   stockQty: 60,  unit: 'capsule', reorderThreshold: 25 },
  { name: 'ORS Sachet',        stockQty: 300, unit: 'sachet', reorderThreshold: 60 },
  { name: 'Azithromycin 250mg',stockQty: 18,  unit: 'tablet', reorderThreshold: 20 },
  { name: 'Metformin 500mg',   stockQty: 90,  unit: 'tablet', reorderThreshold: 30 },
]

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/unicare')
    console.log('MongoDB connected')

    await User.deleteMany({})
    for (const u of seedUsers) {
      await User.create({ ...u, password: await bcrypt.hash(u.password, 10) })
    }

    await Medicine.deleteMany({})
    await Medicine.insertMany(seedMedicines.map(m => ({ ...m, lastRestockedAt: new Date() })))

    console.log(`✅ ${seedUsers.length} users, ${seedMedicines.length} medicines seeded`)
    console.log('All passwords: 123456')
    process.exit(0)
  } catch (err) {
    console.error('Seeding failed:', err)
    process.exit(1)
  }
}

runSeed()