const Medicine = require('../models/Medicine')

// GET /api/medicines?q=   — list/search for live stock lookup while writing a prescription
const listMedicines = async (req, res, next) => {
  try {
    const filter = req.query.q ? { name: new RegExp(req.query.q, 'i') } : {}
    const medicines = await Medicine.find(filter).sort('name')
    res.json(medicines)
  } catch (err) { next(err) }
}

module.exports = { listMedicines }
