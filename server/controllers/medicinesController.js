const Medicine = require('../models/Medicine')
const InventoryLog = require('../models/InventoryLog')
const { logSystemEvent } = require('../utils/systemLogger')

// GET /api/medicines?q= — list/search for live stock lookup while writing a prescription
const listMedicines = async (req, res, next) => {
  try {
    const filter = req.query.q ? { name: new RegExp(req.query.q, 'i') } : {}
    const medicines = await Medicine.find(filter).sort('name')
    res.json(medicines)
  } catch (err) { next(err) }
}

// POST /api/medicines — Add a new medicine
const create = async (req, res, next) => {
  try {
    const { name, stockQty, unit, reorderThreshold } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Medicine name is required' })
    }
    if (stockQty === undefined || isNaN(stockQty) || Number(stockQty) < 0) {
      return res.status(400).json({ message: 'Initial stock quantity must be a non-negative number' })
    }
    if (!unit || !unit.trim()) {
      return res.status(400).json({ message: 'Unit (e.g. tablet, capsule) is required' })
    }
    if (reorderThreshold === undefined || isNaN(reorderThreshold) || Number(reorderThreshold) < 0) {
      return res.status(400).json({ message: 'Reorder threshold must be a non-negative number' })
    }

    const medicine = await Medicine.create({
      name: name.trim(),
      stockQty: Number(stockQty),
      unit: unit.trim(),
      reorderThreshold: Number(reorderThreshold),
      lastRestockedAt: new Date()
    })

    // Log the initial stock as a restock event
    if (Number(stockQty) > 0) {
      await InventoryLog.create({
        medicine: medicine._id,
        changeQty: Number(stockQty),
        reason: 'restocked',
        performedBy: req.user.id
      })
    }

    await logSystemEvent({
      action: 'medicine_created',
      category: 'pharmacy',
      details: `Added new medicine to catalog: ${medicine.name} (${medicine.stockQty} ${medicine.unit}s)`,
      performedBy: req.user.id
    })

    res.status(201).json(medicine)
  } catch (err) {
    next(err)
  }
}

// POST /api/medicines/:id/restock — Restock existing medicine
const restock = async (req, res, next) => {
  try {
    const { id } = req.params
    const { qty } = req.body

    if (qty === undefined || isNaN(qty) || Number(qty) <= 0) {
      return res.status(400).json({ message: 'Restock quantity must be a positive number' })
    }

    const medicine = await Medicine.findById(id)
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' })
    }

    medicine.stockQty += Number(qty)
    medicine.lastRestockedAt = new Date()
    await medicine.save()

    // Create log entry
    await InventoryLog.create({
      medicine: medicine._id,
      changeQty: Number(qty),
      reason: 'restocked',
      performedBy: req.user.id
    })

    await logSystemEvent({
      action: 'medicine_restocked',
      category: 'pharmacy',
      details: `Restocked ${medicine.name}: +${qty} ${medicine.unit}s (New Stock: ${medicine.stockQty})`,
      performedBy: req.user.id
    })

    res.json(medicine)
  } catch (err) {
    next(err)
  }
}

// PATCH /api/medicines/:id — Update medicine settings
const updateSettings = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, unit, reorderThreshold } = req.body

    const medicine = await Medicine.findById(id)
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' })
    }

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ message: 'Name cannot be empty' })
      medicine.name = name.trim()
    }
    if (unit !== undefined) {
      if (!unit.trim()) return res.status(400).json({ message: 'Unit cannot be empty' })
      medicine.unit = unit.trim()
    }
    if (reorderThreshold !== undefined) {
      if (isNaN(reorderThreshold) || Number(reorderThreshold) < 0) {
        return res.status(400).json({ message: 'Reorder threshold must be a non-negative number' })
      }
      medicine.reorderThreshold = Number(reorderThreshold)
    }

    await medicine.save()

    await logSystemEvent({
      action: 'medicine_updated',
      category: 'pharmacy',
      details: `Updated settings for ${medicine.name} (Threshold: ${medicine.reorderThreshold} ${medicine.unit}s)`,
      performedBy: req.user.id
    })

    res.json(medicine)
  } catch (err) {
    next(err)
  }
}

// GET /api/medicines/logs — List all inventory logs
const listLogs = async (req, res, next) => {
  try {
    const logs = await InventoryLog.find({})
      .populate([
        { path: 'medicine', select: 'name unit' },
        { path: 'performedBy', select: 'name role' }
      ])
      .sort('-timestamp')

    res.json(logs)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listMedicines,
  create,
  restock,
  updateSettings,
  listLogs
}
