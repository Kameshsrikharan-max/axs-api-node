const AppError = require("../config/errors/AppError");

function requireStudioAdmin(req, res, next) {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  if (req.user.role !== "studio_admin") {
    return next(new AppError("Studio admin access required", 403));
  }

  next();
}

module.exports = requireStudioAdmin;