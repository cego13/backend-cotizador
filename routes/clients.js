const express = require("express");
const { body, param } = require("express-validator");
const router = express.Router();
const ctrl = require("../controllers/clientController");

const idValidator = [param("id").isMongoId().withMessage("ID inválido")];

const clientValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre del cliente es obligatorio"),

  body("contactName")
    .trim()
    .notEmpty()
    .withMessage("El nombre de la persona de contacto es obligatorio"),

  body("contactPosition")
    .trim()
    .notEmpty()
    .withMessage("El cargo de la persona de contacto es obligatorio"),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Correo inválido"),

  body("phone").optional({ checkFalsy: true }).trim().isString(),
  body("document").optional({ checkFalsy: true }).trim().isString(),
  body("address").optional({ checkFalsy: true }).trim(),
  body("city").optional({ checkFalsy: true }).trim(),
  body("country").optional({ checkFalsy: true }).trim(),
  body("contactEmail")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Correo de contacto inválido"),
  body("contactPhone").optional({ checkFalsy: true }).trim(),
];

router.post("/", clientValidation, ctrl.createClient);
router.get("/", ctrl.getClients);
router.get("/:id", idValidator, ctrl.getClientById);
router.put("/:id", idValidator.concat(clientValidation), ctrl.updateClient);
router.delete("/:id", idValidator, ctrl.deleteClient);

module.exports = router;

