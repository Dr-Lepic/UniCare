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

const sendClaimAssignmentEmail = async (doctorEmail, doctorName, studentName, amount, hospitalName) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    const mailOptions = {
      from: `"UniCare Medical Center" <${process.env.EMAIL_USER || 'no-reply@unicare.edu'}>`,
      to: doctorEmail,
      subject: 'UniCare - New Reimbursement Claim Assigned',
      text: `Hello Dr. ${doctorName},\n\nA new reimbursement claim has been submitted by ${studentName} and assigned to you for review.\n\nHospital: ${hospitalName}\nAmount: ${amount} BDT\n\nPlease log in to your UniCare portal to review and approve/reject this claim.\n\nThank you,\nUniCare Team`,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Claim assignment email sent successfully to ${doctorEmail}`)
  } catch (error) {
    console.warn(`Failed to send claim assignment email to ${doctorEmail}:`, error.message)
  }
}

const sendClaimStatusEmail = async (studentEmail, studentName, amount, status, reviewerName, reviewNotes) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    const mailOptions = {
      from: `"UniCare Medical Center" <${process.env.EMAIL_USER || 'no-reply@unicare.edu'}>`,
      to: studentEmail,
      subject: `UniCare - Reimbursement Claim ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      text: `Hello ${studentName},\n\nYour reimbursement claim of ${amount} BDT has been reviewed and ${status} by Dr. ${reviewerName}.\n\nReviewer Notes:\n${reviewNotes || 'No notes provided.'}\n\nThank you,\nUniCare Team`,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Claim status email sent successfully to ${studentEmail}`)
  } catch (error) {
    console.warn(`Failed to send claim status email to ${studentEmail}:`, error.message)
  }
}

module.exports = { sendOTPEmail, sendClaimAssignmentEmail, sendClaimStatusEmail }

