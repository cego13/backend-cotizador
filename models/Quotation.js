const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema({
  quotationNumber: { type: String, required: true, unique: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  items: [
    {
      description: { type: String, required: true }, // Descripción corta
      longDescription: { type: String }, // 👈 Nueva descripción larga
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
      total: { type: Number, required: true },
    },
  ],
  subtotal: Number,
  iva: Number,
  total: Number,
  notes: String,
  customMessage: String,
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Quotation", quotationSchema);
