function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Something went wrong. Please try again.";

  if (!err.isOperational) {
    console.error("Unexpected error:", err);
  }

  res.status(statusCode).json({ success: false, message });
}

module.exports = errorHandler;
