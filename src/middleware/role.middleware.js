// src/middleware/role.middleware.js
const ApiError = require('../utils/ApiError');
const prisma = require('../config/prisma');

/**
 * Middleware factory to authorize based on roles and/or permissions.
 *
 * Usage:
 *   - Single role: authorize('admin')
 *   - Multiple roles: authorize('admin', 'manager')
 *   - Permission: authorize(['view_users'])   // array for permissions
 *   - Mixed: authorize('admin', ['manage_users'])
 *
 * The middleware will check:
 *   1. If the user's role is in the list of allowed roles → allow.
 *   2. If the user has any of the required permissions (via role → rolePermissions) → allow.
 *
 * system_admin bypasses all checks automatically.
 */
const authorize = (...args) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    // system_admin always has full access
    if (req.user.role === 'system_admin') {
      return next();
    }

    // Separate roles and permissions from arguments
    const allowedRoles = [];
    const requiredPermissions = [];

    for (const arg of args) {
      if (Array.isArray(arg)) {
        // If it's an array, treat as permissions
        requiredPermissions.push(...arg);
      } else if (typeof arg === 'string') {
        // Assume it's a role name
        allowedRoles.push(arg);
      }
    }

    // 1. Check roles
    if (allowedRoles.length > 0 && allowedRoles.includes(req.user.role)) {
      return next();
    }

    // 2. Check permissions (if any required)
    if (requiredPermissions.length > 0) {
      try {
        // Get user's permissions from the database
        const userWithPermissions = await prisma.user.findUnique({
          where: { id: req.user.id },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        });

        if (!userWithPermissions) {
          return next(new ApiError(403, 'Forbidden'));
        }

        const userPermissions = userWithPermissions.role.rolePermissions.map(
          (rp) => rp.permission.permissionKey
        );

        const hasPermission = requiredPermissions.some((perm) =>
          userPermissions.includes(perm)
        );

        if (hasPermission) {
          return next();
        }
      } catch (error) {
        return next(new ApiError(500, 'Error checking permissions'));
      }
    }

    // If we reach here, access is denied
    return next(new ApiError(403, 'Forbidden: insufficient permissions'));
  };
};

/**
 * Middleware to check if the user has access to a specific farm.
 * Already implemented in farmAccess.middleware.js; we can combine here.
 */

module.exports = { authorize };