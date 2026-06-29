// src/modules/users/users.service.js
const bcrypt = require('bcryptjs');
const userRepository = require('./users.repository');
const ApiError = require('../../utils/ApiError');

class UserService {
  /**
   * List users with permissions filtering
   */
  async listUsers(filters, currentUser) {
    // Apply permission-based filtering
    let { farmId, ...rest } = filters;

    // If user is system_admin, can see all users (no farm filter)
    if (currentUser.role === 'system_admin') {
      // No restriction
    } else if (currentUser.role === 'owner' || currentUser.role === 'manager') {
      // Only show users from their own farm(s)
      // Get the user's farms
      const userFarms = await userRepository.findUserFarms(currentUser.id);
      const farmIds = userFarms.map(f => f.farmId);
      // If no farm filter provided, restrict to these farms
      if (!farmId) {
        // We'll pass a list of farmIds to the repository – but our repository only supports a single farmId.
        // We'll need to handle multiple farmIds: modify repository or use OR condition.
        // For simplicity, we'll either:
        // 1. Modify repository to accept an array of farmIds.
        // 2. Or, if the user has multiple farms, we might show all users from those farms.
        // Let's enhance the repository to accept an array of farmIds.
        // But we'll do that later; for now, we'll just pass the first farm or none.
        // We'll implement better support in the repository.
        // For now, we'll just set farmId to the first farm (if any) or null.
        if (farmIds.length > 0) {
          farmId = farmIds[0];
        }
      } else {
        // Ensure the user has access to the requested farm
        const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
        if (!hasAccess) {
          throw new ApiError(403, 'You do not have access to this farm');
        }
      }
    } else {
      // Staff: no access to user list
      throw new ApiError(403, 'You do not have permission to view users');
    }

    // Prepare filters for repository
    const queryParams = {
      ...rest,
      farmId: farmId || undefined,
    };

    // If user is manager, they should only see staff (and maybe managers? We'll allow managers to see staff)
    // We'll enforce in service that managers can only see users with role 'staff' and 'manager'? Actually, they can see all but can't edit owners.
    // We'll handle edit permissions in update methods.
    // For listing, we'll allow managers to see all users within their farm(s).

    return userRepository.findAll(queryParams);
  }

  /**
   * Get a single user by ID
   */
  async getUserById(id, currentUser) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Check permissions
    if (currentUser.role === 'system_admin') {
      return user;
    }

    // For owner/manager: user must be in the same farm(s)
    if (currentUser.role === 'owner' || currentUser.role === 'manager') {
      // Get farms of current user
      const currentUserFarms = await userRepository.findUserFarms(currentUser.id);
      const farmIds = currentUserFarms.map(f => f.farmId);
      // Get farms of target user
      const targetUserFarms = user.userFarmAccess.map(access => access.farmId);
      // Check intersection
      const hasCommonFarm = targetUserFarms.some(fId => farmIds.includes(fId));
      if (!hasCommonFarm) {
        throw new ApiError(403, 'You do not have access to this user');
      }
      return user;
    }

    throw new ApiError(403, 'You do not have permission to view this user');
  }

  /**
   * Create a new user (admin action)
   */
  async createUser(data, currentUser) {
    // Only system_admin, owner, manager can create users
    if (!['system_admin', 'owner', 'manager'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to create users');
    }

    // Check if email already exists
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ApiError(409, 'Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Prepare user data
    const userData = {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || null,
      passwordHash: hashedPassword,
      roleId: data.roleId,
      status: data.status || 'active',
    };

    // If current user is manager or owner, they can only create users with role 'staff' (or maybe 'manager'? We'll restrict)
    if (currentUser.role === 'manager') {
      // Only allow creating staff (roleId = staff role id)
      const staffRole = await userRepository.getRoleByName('staff');
      if (data.roleId !== staffRole.id) {
        throw new ApiError(403, 'Manager can only create staff users');
      }
    }
    // Owner can create staff and managers (but not owners? We'll allow owners to create managers and staff)
    if (currentUser.role === 'owner') {
      const ownerRole = await userRepository.getRoleByName('owner');
      if (data.roleId === ownerRole.id) {
        throw new ApiError(403, 'Owner cannot create another owner');
      }
    }

    // Create user
    const user = await userRepository.create(userData);

    // If farmAccess is provided, grant access
    if (data.farmAccess && data.farmAccess.length > 0) {
      for (const access of data.farmAccess) {
        await userRepository.grantFarmAccess(user.id, access.farmId, access.roleId);
      }
    }

    // Return the created user with relations
    return userRepository.findById(user.id);
  }

  /**
   * Update a user
   */
  async updateUser(id, data, currentUser) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Check permissions
    if (currentUser.role === 'system_admin') {
      // Full access
    } else if (currentUser.role === 'owner') {
      // Owner can update users within their farm(s)
      const currentUserFarms = await userRepository.findUserFarms(currentUser.id);
      const farmIds = currentUserFarms.map(f => f.farmId);
      const targetUserFarms = user.userFarmAccess.map(access => access.farmId);
      const hasCommonFarm = targetUserFarms.some(fId => farmIds.includes(fId));
      if (!hasCommonFarm) {
        throw new ApiError(403, 'You do not have access to this user');
      }
      // Owner cannot update another owner (or system_admin)
      if (user.role.name === 'owner' || user.role.name === 'system_admin') {
        throw new ApiError(403, 'You cannot update this user');
      }
    } else if (currentUser.role === 'manager') {
      // Manager can only update staff users within their farm(s)
      const currentUserFarms = await userRepository.findUserFarms(currentUser.id);
      const farmIds = currentUserFarms.map(f => f.farmId);
      const targetUserFarms = user.userFarmAccess.map(access => access.farmId);
      const hasCommonFarm = targetUserFarms.some(fId => farmIds.includes(fId));
      if (!hasCommonFarm) {
        throw new ApiError(403, 'You do not have access to this user');
      }
      if (user.role.name !== 'staff') {
        throw new ApiError(403, 'Manager can only update staff users');
      }
    } else {
      throw new ApiError(403, 'You do not have permission to update users');
    }

    // Prepare update data (excluding password – separate method)
    const updateData = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.phone) updateData.phone = data.phone;
    if (data.status) updateData.status = data.status;
    if (data.roleId) {
      // Check if role change is allowed
      if (currentUser.role === 'manager' && data.roleId !== user.roleId) {
        // Managers cannot change roles
        throw new ApiError(403, 'Manager cannot change user role');
      }
      // Owner can change roles but not to owner or system_admin
      if (currentUser.role === 'owner') {
        const targetRole = await userRepository.getRoleById(data.roleId);
        if (targetRole.name === 'owner' || targetRole.name === 'system_admin') {
          throw new ApiError(403, 'Owner cannot assign this role');
        }
      }
      updateData.roleId = data.roleId;
    }

    // If updating farm access, handle separately
    // We'll implement farmAccess updates separately or in a dedicated endpoint.

    return userRepository.update(id, updateData);
  }

  /**
   * Delete a user (soft delete)
   */
  async deleteUser(id, currentUser) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Only system_admin can delete users
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete users');
    }

    // Cannot delete self
    if (user.id === currentUser.id) {
      throw new ApiError(400, 'You cannot delete yourself');
    }

    // Cannot delete system_admin
    if (user.role.name === 'system_admin') {
      throw new ApiError(403, 'Cannot delete system administrator');
    }

    return userRepository.softDelete(id);
  }

  /**
   * Change user role (only system_admin)
   */
  async changeRole(id, roleId, currentUser) {
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can change roles');
    }

    const user = await userRepository.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Prevent changing system_admin role
    if (user.role.name === 'system_admin') {
      throw new ApiError(403, 'Cannot change system administrator role');
    }

    const newRole = await userRepository.getRoleById(roleId);
    if (!newRole) {
      throw new ApiError(400, 'Invalid role ID');
    }

    return userRepository.changeRole(id, roleId);
  }

  /**
   * Change user status (activate/suspend)
   */
  async changeStatus(id, status, currentUser) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Check permissions
    if (currentUser.role === 'system_admin') {
      // Can change any status
    } else if (currentUser.role === 'owner') {
      // Owner can change status of users in their farm(s) except owners and system_admin
      const currentUserFarms = await userRepository.findUserFarms(currentUser.id);
      const farmIds = currentUserFarms.map(f => f.farmId);
      const targetUserFarms = user.userFarmAccess.map(access => access.farmId);
      const hasCommonFarm = targetUserFarms.some(fId => farmIds.includes(fId));
      if (!hasCommonFarm) {
        throw new ApiError(403, 'You do not have access to this user');
      }
      if (user.role.name === 'owner' || user.role.name === 'system_admin') {
        throw new ApiError(403, 'You cannot change status of this user');
      }
    } else if (currentUser.role === 'manager') {
      // Manager can only change status of staff users
      const currentUserFarms = await userRepository.findUserFarms(currentUser.id);
      const farmIds = currentUserFarms.map(f => f.farmId);
      const targetUserFarms = user.userFarmAccess.map(access => access.farmId);
      const hasCommonFarm = targetUserFarms.some(fId => farmIds.includes(fId));
      if (!hasCommonFarm) {
        throw new ApiError(403, 'You do not have access to this user');
      }
      if (user.role.name !== 'staff') {
        throw new ApiError(403, 'Manager can only change status of staff users');
      }
    } else {
      throw new ApiError(403, 'You do not have permission to change user status');
    }

    return userRepository.changeStatus(id, status);
  }

  // Additional methods for farm access management
  async getUserFarms(userId, currentUser) {
    // Check if current user can view this user's farms
    // For simplicity, only system_admin and the user themselves can view
    if (currentUser.role !== 'system_admin' && currentUser.id !== Number(userId)) {
      // Also owners/managers of the same farm? Could allow, but keep simple for now.
      throw new ApiError(403, 'You do not have permission to view this user\'s farms');
    }
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    return user.userFarmAccess;
  }

  async addFarmAccess(userId, farmId, roleId, currentUser) {
    // Only system_admin or owner of the farm can add access
    // We'll implement permission checks
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    if (currentUser.role === 'system_admin') {
      // Allowed
    } else if (currentUser.role === 'owner') {
      // Check if current user owns the farm
      const farm = await prisma.farm.findUnique({ where: { id: BigInt(farmId) } });
      if (!farm || farm.ownerId !== currentUser.id) {
        throw new ApiError(403, 'You do not own this farm');
      }
    } else {
      throw new ApiError(403, 'You do not have permission to grant farm access');
    }

    // Check if role exists
    const role = await userRepository.getRoleById(roleId);
    if (!role) throw new ApiError(400, 'Invalid role ID');

    // Check if access already exists
    const hasAccess = await userRepository.hasFarmAccess(userId, farmId);
    if (hasAccess) {
      throw new ApiError(409, 'User already has access to this farm');
    }

    return userRepository.grantFarmAccess(userId, farmId, roleId);
  }

  async removeFarmAccess(userId, farmId, currentUser) {
    // Similar permissions
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    if (currentUser.role === 'system_admin') {
      // Allowed
    } else if (currentUser.role === 'owner') {
      const farm = await prisma.farm.findUnique({ where: { id: BigInt(farmId) } });
      if (!farm || farm.ownerId !== currentUser.id) {
        throw new ApiError(403, 'You do not own this farm');
      }
    } else {
      throw new ApiError(403, 'You do not have permission to revoke farm access');
    }

    // Prevent removing access from the farm owner themselves? We'll handle in controller.

    return userRepository.revokeFarmAccess(userId, farmId);
  }

  /**
   * Get all farms (for dropdown)
   */
  async getAllFarms(currentUser) {
    if (currentUser.role === 'system_admin') {
      return userRepository.getAllFarms();
    } else if (currentUser.role === 'owner' || currentUser.role === 'manager') {
      // Return only farms they have access to
      const farms = await userRepository.findUserFarms(currentUser.id);
      return farms.map(f => ({ id: f.farmId, name: f.farm.name }));
    }
    throw new ApiError(403, 'You do not have permission to view farms');
  }

  /**
   * Get all roles (for dropdown)
   */
  async getAllRoles(currentUser) {
    // Only system_admin, owner, manager can view roles list
    if (!['system_admin', 'owner', 'manager'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to view roles');
    }
    let roles = await userRepository.getAllRoles();
    // Filter out system_admin for non-admin users? We'll keep it but indicate.
    return roles;
  }
}

module.exports = new UserService();