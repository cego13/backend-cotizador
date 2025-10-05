const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },       // Nombre del cliente o empresa cliente
  document: { type: String },                   // NIT o cédula
  address: { type: String },
  city: { type: String },
  country: { type: String, default: 'Colombia' },
  email: { type: String },
  phone: { type: String },
  contactName: { type: String },                // Persona de contacto
  contactPosition: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);
