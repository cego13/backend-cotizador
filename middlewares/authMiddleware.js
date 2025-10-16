const jwt = require("jsonwebtoken");

// Middleware para verificar si el usuario tiene un token válido
const authRequired = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ message: "No hay token, autorización denegada" });
  }

  try {
    // El token viene en formato "Bearer <token>"
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET || "miclavesecreta123");
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error verificando token:", error);
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};

// Middleware para verificar si el usuario tiene rol admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ error: "Acceso denegado: se requiere rol admin" });
  }
};

module.exports = { authRequired, isAdmin };
