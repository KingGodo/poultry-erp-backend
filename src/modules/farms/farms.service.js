// src/modules/farms/farms.service.js
const farmRepository = require('./farms.repository');
const userRepository = require('../users/users.repository');
const ApiError = require('../../utils/ApiError');

class FarmService {
  /**
   * List farms with permission-based filtering
   */
  async listFarms(filters, currentUser) {
    let { userId, ...rest } = filters;

    // If user is system_admin, show all farms
    if (currentUser.role === 'system_admin') {
      // No restriction
    } else if (currentUser.role === 'owner' || currentUser.role === 'manager') {
      // Only show farms they have access to
      const userFarms = await farmRepository.getFarmsByUser(currentUser.id);
      const farmIds = userFarms.map(f => f.farmId);
      // We need to filter by these farmIds in repository
      // We'll use userId filter to apply access restriction
      userId = currentUser.id;
    } else {
      // Staff: no access to farm list
      throw new ApiError(403, 'You do not have permission to view farms');
    }

    return farmRepository.findAll({
      ...rest,
      userId,
    });
  }

  async getFarmById(id, currentUser) {
    const farm = await farmRepository.findById(id);
    if (!farm) {
      throw new ApiError(404, 'Farm not found');
    }

    // Check access
    if (currentUser.role === 'system_admin') {
      return farm;
    }

    if (currentUser.role === 'owner' && farm.ownerId === currentUser.id) {
      return farm;
    }

    // Check if user has access via UserFarmAccess
    const hasAccess = await userRepository.hasFarmAccess(currentUser.id, id);
    if (hasAccess) {
      return farm;
    }

    throw new ApiError(403, 'You do not have access to this farm');
  }

  async createFarm(data, currentUser) {
    // Only system_admin or owner can create farms
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to create farms');
    }

    // If user is owner, they can create a farm for themselves
    if (currentUser.role === 'owner') {
      data.ownerId = currentUser.id;
    } else {
      // system_admin can specify ownerId, or default to self
      if (!data.ownerId) {
        data.ownerId = currentUser.id;
      }
    }

    // Create farm
    const farm = await farmRepository.create(data);

    // Grant the owner access to the farm (if not already)
    // The owner should already have access via registration, but we'll ensure it
    const ownerRole = await userRepository.getRoleByName('owner');
    const hasAccess = await userRepository.hasFarmAccess(farm.ownerId, farm.id);
    if (!hasAccess) {
      await userRepository.grantFarmAccess(farm.ownerId, farm.id, ownerRole.id);
    }

    return farm;
  }

  async updateFarm(id, data, currentUser) {
    const farm = await farmRepository.findById(id);
    if (!farm) {
      throw new ApiError(404, 'Farm not found');
    }

    // Permission check
    if (currentUser.role === 'system_admin') {
      // Full access
    } else if (currentUser.role === 'owner' && farm.ownerId === currentUser.id) {
      // Owner can update their own farm
    } else {
      throw new ApiError(403, 'You do not have permission to update this farm');
    }

    // Prevent changing ownerId unless system_admin
    if (data.ownerId && currentUser.role !== 'system_admin') {
      delete data.ownerId;
    }

    return farmRepository.update(id, data);
  }

  async deleteFarm(id, currentUser) {
    // Only system_admin can delete farms
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete farms');
    }

    const farm = await farmRepository.findById(id);
    if (!farm) {
      throw new ApiError(404, 'Farm not found');
    }

    return farmRepository.softDelete(id);
  }

  async getFarmUsers(farmId, currentUser) {
    const farm = await farmRepository.findById(farmId);
    if (!farm) {
      throw new ApiError(404, 'Farm not found');
    }

    // Permission: system_admin, owner of the farm, or manager with access
    if (currentUser.role === 'system_admin') {
      // allowed
    } else if (currentUser.role === 'owner' && farm.ownerId === currentUser.id) {
      // allowed
    } else if (currentUser.role === 'manager') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this farm');
      }
    } else {
      throw new ApiError(403, 'You do not have permission to view farm users');
    }

    return farmRepository.getUsersByFarm(farmId);
  }

  async updateFarmSettings(id, settings, currentUser) {
    const farm = await farmRepository.findById(id);
    if (!farm) {
      throw new ApiError(404, 'Farm not found');
    }

    // Permission: system_admin or owner of the farm
    if (currentUser.role === 'system_admin') {
      // allowed
    } else if (currentUser.role === 'owner' && farm.ownerId === currentUser.id) {
      // allowed
    } else {
      throw new ApiError(403, 'You do not have permission to update farm settings');
    }

    // Allowed settings fields
    const allowedSettings = ['name', 'location', 'contactPhone', 'currency', 'timezone'];
    const updateData = {};
    for (const key of allowedSettings) {
      if (settings[key] !== undefined) {
        updateData[key] = settings[key];
      }
    }

    return farmRepository.updateSettings(id, updateData);
  }
}

module.exports = new FarmService();