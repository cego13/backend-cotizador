const express = require("express");
const { login, createUser } = require("../controllers/authController");
const { authRequired, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// 🔑 Login (público)
router.post("/login", login);

// 👑 Crear usuario (solo admin)
router.post("/register", authRequired, isAdmin, createUser);

module.exports = router;
