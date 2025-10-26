const { validationResult } = require('express-validator');
const Company = require('../models/Company');

const handleValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('Validación fallida');
    err.status = 400;
    err.details = errors.array();
    throw err;
  }
};

exports.createCompany = async (req, res, next) => {
  try {
    handleValidation(req);
    const payload = req.body;
    const company = new Company(payload);
    await company.save();
    res.status(201).json(company);
  } catch (err) { next(err); }
};

exports.getCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.json(companies);
  } catch (err) { next(err); }
};

exports.getCompanyById = async (req, res, next) => {
  try {
    handleValidation(req);
    const { id } = req.params;
    const company = await Company.findOne({ _id: id, isDeleted: false });
    if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });
    res.json(company);
  } catch (err) { next(err); }
};

// Endpoint que devuelve sólo lo necesario para PDF/cotización
exports.getCompanyForPDF = async (req, res, next) => {
  try {
    handleValidation(req);
    const { id } = req.params;
    const company = await Company.findOne({ _id: id, isDeleted: false }).lean();
    if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

    const pdfData = {
      id: company._id,
      name: company.name,
      logoUrl: company.logoUrl,
      email: company.email,
      representative: {
        name: company.representative?.name || '',
        position: company.representative?.position || '',
        email: company.representative?.email || '',
        phone: company.representative?.phone || '',
        signatureUrl: company.representative?.signatureUrl || ''
      }
    };
    res.json(pdfData);
  } catch (err) { next(err); }
};

exports.updateCompany = async (req, res, next) => {
  try {
    handleValidation(req);
    const { id } = req.params;
    const updates = req.body;
    const company = await Company.findOneAndUpdate({ _id: id, isDeleted: false }, updates, { new: true, runValidators: true });
    if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });
    res.json(company);
  } catch (err) { next(err); }
};

exports.deleteCompany = async (req, res, next) => {
  try {
    handleValidation(req);
    const { id } = req.params;
    const company = await Company.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });
    res.json({ message: 'Empresa eliminada (isDeleted=true)', companyId: company._id });
  } catch (err) { next(err); }
};

