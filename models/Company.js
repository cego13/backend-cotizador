const mongoose = require('mongoose');

const RepresentativeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String },
  email: { type: String },
  phone: { type: String },
  signatureUrl: { type: String }
}, { _id: false });

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },      
  nit: { type: String, required: true },       
  logoUrl: { type: String },                    
  email: { type: String, required: true },    
  representative: { type: RepresentativeSchema, required: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);
