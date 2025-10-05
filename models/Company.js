const mongoose = require('mongoose');

const RepresentativeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String },
  email: { type: String },
  phone: { type: String },
  signatureUrl: { type: String } // imagen de firma (URL o base64)
}, { _id: false });

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },      // Nombre de la empresa
  nit: { type: String, required: true },        // 🆕 NIT de la empresa
  logoUrl: { type: String },                    // Logo (URL o base64)
  email: { type: String, required: true },     // Correo institucional
  representative: { type: RepresentativeSchema, required: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);
