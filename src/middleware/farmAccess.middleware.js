// src/middleware/farmAccess.middleware.js
const ApiError = require('../utils/ApiError');
const prisma = require('../config/prisma');

const checkFarmAccess = (farmIdParam = 'id') => {  // ← default to 'id'
  return async (req, res, next) => {
    try {
      // system_admin bypasses all checks
      if (req.user.role === 'system_admin') {
        return next();
      }

      // Look for farm ID in params (with given param name) or body
      const farmId = req.params[farmIdParam] || req.body.farmId || req.body.farm_id;
      if (!farmId) {
        return next(new ApiError(400, 'Farm ID is required'));
      }

      const userId = BigInt(req.user.id); // ← convert to BigInt

      // Check if user has access to this farm
      const access = await prisma.userFarmAccess.findUnique({
        where: {
          userId_farmId: {
            userId: userId,
            farmId: BigInt(farmId),
          },
        },
      });

      if (!access) {
        return next(new ApiError(403, 'You do not have access to this farm'));
      }

      req.farmId = BigInt(farmId);
      req.farmRole = access.roleId;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { checkFarmAccess };