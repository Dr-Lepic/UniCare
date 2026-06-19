const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Assuming you use bcryptjs in your app or we'll just insert raw if there is no pre-save hook. Since your current User.js doesn't show a pre-save hook for password hashing, we'll hash it here.
require('dotenv').config({ path: '../.env' }); // Make sure path to .env is correct

const User = require('../models/User');

const seedData = async () => {
  try {
    // Connect to Database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/unicare');
    console.log('MongoDB Connected for Seeding');

    // Clear existing data (optional)
    await User.deleteMany();
    console.log('Old users deleted');

    // Need to require bcrypt if not required above
    // const bcrypt = require('bcryptjs'); 
    
    // Create dummy users
    // Note: If your User model hashes password in a pre('save') hook, remove the bcrypt hashing here. 
    // Assuming no pre-save hook based on User.js snippet. If you have bcryptjs, let's try to use it.
    // We will just use plaintext 'password123' if bcrypt is not installed. Let's assume standard Express auth setup.
    
    // Fallback simple password assignment if no bcrypt
    let hashedDoctorPw = 'password123';
    let hashedNursePw = 'password123';
    let hashedStudentPw = 'password123';
    
    try {
      const b = require('bcryptjs');
      const salt = await b.genSalt(10);
      hashedDoctorPw = await b.hash('doc123', salt);
      hashedNursePw = await b.hash('nurse123', salt);
      hashedStudentPw = await b.hash('student123', salt);
    } catch(e) {
      console.log('bcryptjs not found, using plaintext passwords');
    }

    const users = [
      {
        name: 'Dr. Mahbub',
        email: 'mahbubrahman@iut-dhaka.edu',
        password: hashedDoctorPw,
        role: 'doctor',
        specialty: 'Cardiology'
      },
      {
        name: 'Nurse Asif',
        email: 'abidurrahman22@iut-dhaka.edu',
        password: hashedNursePw,
        role: 'nurse',
        station: 'ICU'
      },
      {
        name: 'Student WMBA',
        email: 'wahidazhar@iut-dhaka.edu',
        password: hashedStudentPw,
        role: 'student',
        studentId: '36',
        department: 'Medicine'
      }
    ];

    await User.insertMany(users);
    console.log('Seed Data Inserted Successfully!');
    console.log('--- LOGIN CREDENTIALS ---');
    console.log('Doctor: doctor@unicare.com / doc123 (or password123)');
    console.log('Nurse: nurse@unicare.com / nurse123 (or password123)');
    console.log('Student: student@unicare.com / student123 (or password123)');
    
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
