const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ error: "Acceso denegado: se requiere rol admin" });
  }
};

module.exports = adminMiddleware;