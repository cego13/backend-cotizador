const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/clientController');

const idValidator = [param('id').isMongoId().withMessage('ID inválido')];

const clientValidation = [
  body('name').notEmpty().withMessage('El nombre es obligatorio'),
  body('email').optional().isEmail().withMessage('Correo inválido'),
  body('phone').optional().isString(),
  body('document').optional().isString()
];

router.post('/', clientValidation, ctrl.createClient);
router.get('/', ctrl.getClients);
router.get('/:id', idValidator, ctrl.getClientById);
router.put('/:id', idValidator.concat(clientValidation), ctrl.updateClient);
router.delete('/:id', idValidator, ctrl.deleteClient);

module.exports = router;
