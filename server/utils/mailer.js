const nodemailer = require('nodemailer')

const sendOTPEmail = async (studentEmail, studentName, otpCode, medicinesList) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    const medsText = medicinesList.map(m => `- ${m.name}: ${m.dosage} (Qty: ${m.qty} ${m.unit || 'unit'})`).join('\n')

    const mailOptions = {
      from: `"UniCare Medical Center" <${process.env.EMAIL_USER || 'no-reply@unicare.edu'}>`,
      to: studentEmail,
      subject: 'UniCare - Your Prescription OTP for Collection',
      text: `Hello ${studentName},\n\nYour prescription has been written by the doctor. Please show the following OTP code to the pharmacist to collect your medicine:\n\nOTP Code: ${otpCode}\nValid for: 7 days\n\nPrescribed Medicines:\n${medsText}\n\nThank you,\nUniCare Team`,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Email sent successfully to ${studentEmail}`)
  } catch (error) {
    console.warn(`Failed to send email to ${studentEmail}:`, error.message)
  }
}

module.exports = { sendOTPEmail }
