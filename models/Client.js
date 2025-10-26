const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },       
  document: { type: String },                   
  address: { type: String },
  city: { type: String },
  country: { type: String, default: 'Colombia' },
  email: { type: String },
  phone: { type: String },
  contactName: { type: String },                
  contactPosition: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);
