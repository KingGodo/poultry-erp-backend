// src/middleware/error.middleware.js
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  // Log error (you can use a logger later)
  console.error('Error:', err);

  // If it's our ApiError, use its status and message
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;