const express = require("express");
const { body, param } = require("express-validator");
const router = express.Router();
const ctrl = require("../controllers/quotationController");

const idValidator = [param("id").isMongoId().withMessage("ID inválido")];

const itemValidation = body("items").isArray({ min: 1 }).withMessage("Debe incluir al menos un ítem");

const quotationValidation = [
  body("quotationNumber").notEmpty().withMessage("El número de cotización es requerido"),
  body("company").notEmpty().withMessage("El ID de la empresa es requerido"),
  body("client").notEmpty().withMessage("El ID del cliente es requerido"),
  itemValidation,
  body("subtotal").isNumeric().withMessage("Subtotal debe ser numérico"),
  body("iva").isNumeric().withMessage("IVA debe ser numérico"),
  body("total").isNumeric().withMessage("Total debe ser numérico")
];

router.post("/", quotationValidation, ctrl.createQuotation);
router.get("/", ctrl.getQuotations);
router.get("/:id", idValidator, ctrl.getQuotationById);
router.put("/:id", idValidator.concat(quotationValidation), ctrl.updateQuotation);
router.delete("/:id", idValidator, ctrl.deleteQuotation);
router.get("/:id/pdf", idValidator, ctrl.generateQuotationPDF);

module.exports = router;
