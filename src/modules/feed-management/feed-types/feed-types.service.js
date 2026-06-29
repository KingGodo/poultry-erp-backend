// src/modules/feed-management/feed-types/feed-types.service.js
const feedTypeRepository = require('./feed-types.repository');
const userRepository = require('../../users/users.repository');
const ApiError = require('../../../utils/ApiError');

class FeedTypeService {
  /**
   * List feed types with permission-based filtering
   */
  async listFeedTypes(filters, currentUser) {
    let { farmId, ...rest } = filters;

    // system_admin sees all
    if (currentUser.role === 'system_admin') {
      // no filter
    } else if (['owner', 'manager', 'staff'].includes(currentUser.role)) {
      // Get farms the user has access to
      const userFarms = await userRepository.findUserFarms(currentUser.id);
      const farmIds = userFarms.map(f => f.farmId);

      // If no farm filter provided, use the first farm (if any)
      if (!farmId) {
        if (farmIds.length > 0) farmId = farmIds[0];
      } else {
        // Ensure user has access to the requested farm
        const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
        if (!hasAccess) {
          throw new ApiError(403, 'You do not have access to this farm');
        }
      }
    } else {
      throw new ApiError(403, 'You do not have permission to view feed types');
    }

    return feedTypeRepository.findAll({ ...rest, farmId });
  }

  /**
   * Get a single feed type by ID
   */
  async getFeedTypeById(id, currentUser) {
    const feedType = await feedTypeRepository.findById(id);
    if (!feedType) {
      throw new ApiError(404, 'Feed type not found');
    }

    // Check farm access
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, feedType.farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this feed type');
      }
    }

    return feedType;
  }

  /**
   * Create a new feed type
   */
  async createFeedType(data, currentUser) {
    // Only system_admin and owner can create feed types
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to create feed types');
    }

    // Check farm access
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, data.farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this farm');
      }
    }

    // Check for duplicate name within the same farm
    const existing = await feedTypeRepository.findByName(data.farmId, data.name);
    if (existing) {
      throw new ApiError(409, 'Feed type with this name already exists in this farm');
    }

    return feedTypeRepository.create(data);
  }

  /**
   * Update a feed type
   */
  async updateFeedType(id, data, currentUser) {
    const feedType = await feedTypeRepository.findById(id);
    if (!feedType) {
      throw new ApiError(404, 'Feed type not found');
    }

    // Only system_admin and owner can update feed types
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to update feed types');
    }

    // Check farm access
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, feedType.farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this feed type');
      }
    }

    // If name is being changed, check uniqueness
    if (data.name && data.name !== feedType.name) {
      const existing = await feedTypeRepository.findByName(feedType.farmId, data.name);
      if (existing) {
        throw new ApiError(409, 'Feed type with this name already exists in this farm');
      }
    }

    return feedTypeRepository.update(id, data);
  }

  /**
   * Delete a feed type (hard delete)
   */
  async deleteFeedType(id, currentUser) {
    // Only system_admin can delete feed types
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete feed types');
    }

    const feedType = await feedTypeRepository.findById(id);
    if (!feedType) {
      throw new ApiError(404, 'Feed type not found');
    }

    // Prevent deletion if feed type is used in any purchase or distribution
    if (feedType._count.purchases > 0 || feedType._count.distributions > 0) {
      throw new ApiError(400, 'Cannot delete feed type that has purchases or distributions');
    }

    return feedTypeRepository.delete(id);
  }
}

module.exports = new FeedTypeService();