const AppError = require("../config/errors/AppError");

function requireAdminAccess(req, res, next) {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }
  if (!["super_admin", "studio_admin"].includes(req.user.role)) {
    return next(new AppError("Admin access required", 403));
  }
  next();
}

module.exports = requireAdminAccess;