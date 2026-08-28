const AppError = require("../config/errors/AppError");

function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  if (req.user.role !== "super_admin") {
    return next(new AppError("Super admin access required", 403));
  }

  next();
}

module.exports = requireSuperAdmin;