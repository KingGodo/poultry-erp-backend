const authService = require('./auth.service');
const ApiResponse = require('../../utils/ApiResponse');
const { verifyRefreshToken, generateAccessToken } = require('../../utils/generateToken');
const ApiError = require('../../utils/ApiError');

class AuthController {
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json(new ApiResponse(201, user, 'User registered successfully'));
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json(new ApiResponse(200, result, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required');
      }

      const decoded = verifyRefreshToken(refreshToken);
      const user = await authService.getProfile(decoded.id);
      
      const newAccessToken = generateAccessToken({
        id: user.id,
        role: user.role.name,
        farmId: user.userFarmAccess.find(a => a.isDefault)?.farmId || null
      });

      res.status(200).json(new ApiResponse(200, { accessToken: newAccessToken }, 'Token refreshed'));
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        next(new ApiError(401, 'Invalid or expired refresh token'));
      } else {
        next(error);
      }
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);
      res.status(200).json(new ApiResponse(200, user, 'Profile retrieved'));
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, currentPassword, newPassword);
      res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    // Since we're using stateless JWT, logout is handled client-side by removing token.
    // We can still implement a blacklist if needed (optional).
    res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
  }
}

module.exports = new AuthController();