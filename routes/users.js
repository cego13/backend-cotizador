const express = require("express");
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require("../controllers/userController");
const { authRequired, isAdmin } = require("../middlewares/authMiddleware"); // 👈 importa ambas funciones

// Solo admin puede acceder
router.get("/", authRequired, isAdmin, getUsers);
router.post("/", authRequired, isAdmin, createUser);
router.put("/:id", authRequired, isAdmin, updateUser);
router.delete("/:id", authRequired, isAdmin, deleteUser);

module.exports = router;
