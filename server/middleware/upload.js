const multer = require('multer')
const path = require('path')

// Define storage location and filename format
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_')
    cb(null, `${baseName}-${uniqueSuffix}${ext}`)
  }
})

// File type filter (Images and PDFs only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/
  const ext = path.extname(file.originalname).toLowerCase()
  const mimeType = file.mimetype

  const matchExt = allowedTypes.test(ext)
  const matchMime = allowedTypes.test(mimeType)

  if (matchExt && matchMime) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG, and PDF files are allowed!'), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

module.exports = upload
