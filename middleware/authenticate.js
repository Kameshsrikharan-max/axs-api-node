const userRepository = require("../repository/user.repository");
const AppError = require("../config/errors/AppError");

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : header;

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    let email;
    try {
      const decoded = Buffer.from(token, "base64").toString("utf8");
      email = decoded.split(":")[0];
    } catch {
      throw new AppError("Invalid token", 401);
    }

    if (!email) {
      throw new AppError("Invalid token", 401);
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("User not found", 401);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;