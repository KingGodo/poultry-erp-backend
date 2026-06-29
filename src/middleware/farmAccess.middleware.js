// src/middleware/farmAccess.middleware.js
const ApiError = require('../utils/ApiError');
const prisma = require('../config/prisma');

const checkFarmAccess = (farmIdParam = 'farmId') => {
  return async (req, res, next) => {
    try {
      // If user is system_admin, grant full access
      if (req.user.role === 'system_admin') {
        return next();
      }

      const farmId = req.params[farmIdParam] || req.body.farm_id;
      if (!farmId) {
        return next(new ApiError(400, 'Farm ID is required'));
      }

      const userId = req.user.id;

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

      req.farmId = farmId;
      req.farmRole = access.roleId;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { checkFarmAccess };