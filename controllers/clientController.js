const { validationResult } = require('express-validator');
const Client = require('../models/Client');

const handleValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('Validación fallida');
    err.status = 400;
    err.details = errors.array();
    throw err;
  }
};

exports.createClient = async (req, res, next) => {
  try {
    handleValidation(req);
    const client = new Client(req.body);
    await client.save();
    res.status(201).json(client);
  } catch (err) { next(err); }
};

exports.getClients = async (req, res, next) => {
  try {
    const clients = await Client.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) { next(err); }
};

exports.getClientById = async (req, res, next) => {
  try {
    handleValidation(req);
    const { id } = req.params;
    const client = await Client.findOne({ _id: id, isDeleted: false });
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(client);
  } catch (err) { next(err); }
};

exports.updateClient = async (req, res, next) => {
  try {
    handleValidation(req);
    const { id } = req.params;
    const updated = await Client.findOneAndUpdate(
      { _id: id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(updated);
  } catch (err) { next(err); }
};

exports.deleteClient = async (req, res, next) => {
  try {
    handleValidation(req);
    const { id } = req.params;
    const deleted = await Client.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!deleted) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json({ message: 'Cliente eliminado', clientId: deleted._id });
  } catch (err) { next(err); }
};
