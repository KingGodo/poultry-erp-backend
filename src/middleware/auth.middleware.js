const { verifyAccessToken } = require('../utils/generateToken');
const ApiError = require('../utils/ApiError');
const authRepository = require('../modules/auth/auth.repository');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Unauthorized - No token provided'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return next(new ApiError(401, 'Unauthorized - Invalid token'));
    }

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Unauthorized - Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Unauthorized - Token expired'));
    }
    next(error);
  }
};

module.exports = { authenticate };