const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/companyController');

const idValidator = [ param('id').isMongoId().withMessage('ID inválido') ];

// Validaciones para crear/actualizar
const companyValidation = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
   body('nit').notEmpty().withMessage('El NIT es requerido'), // 🆕 agregado
  body('email').notEmpty().isEmail().withMessage('Email institucional inválido'),
  body('logoUrl').optional().isString(),
  body('representative').notEmpty().withMessage('Representative es requerido'),
  body('representative.name').notEmpty().withMessage('Nombre del representante es requerido'),
  body('representative.position').optional().isString(),
  body('representative.email').optional().isEmail().withMessage('Email del representante inválido'),
  body('representative.phone').optional().isString(),
  body('representative.signatureUrl').optional().isString()
];

// Crear empresa
router.post('/', companyValidation, ctrl.createCompany);

// Listar empresas
router.get('/', ctrl.getCompanies);

// Obtener empresa por id
router.get('/:id', idValidator, ctrl.getCompanyById);

// Obtener datos para PDF
router.get('/:id/pdf', idValidator, ctrl.getCompanyForPDF);

// Actualizar empresa
router.put('/:id', idValidator.concat(companyValidation), ctrl.updateCompany);

// Eliminar (borrado lógico)
router.delete('/:id', idValidator, ctrl.deleteCompany);

module.exports = router;
