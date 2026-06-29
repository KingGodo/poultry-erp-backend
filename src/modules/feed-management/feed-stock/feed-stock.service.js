const feedStockRepository = require('./feed-stock.repository');
const userRepository = require('../../users/users.repository');
const ApiError = require('../../../utils/ApiError');

class FeedStockService {
  async listStock(filters, currentUser) {
    let { farmId, ...rest } = filters;

    if (currentUser.role === 'system_admin') {
      // no filter
    } else if (['owner', 'manager', 'staff'].includes(currentUser.role)) {
      const userFarms = await userRepository.findUserFarms(currentUser.id);
      const farmIds = userFarms.map(f => f.farmId);
      if (!farmId) {
        if (farmIds.length > 0) farmId = farmIds[0];
      } else {
        const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
        if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
      }
    } else {
      throw new ApiError(403, 'You do not have permission to view feed stock');
    }

    return feedStockRepository.findAll({ ...rest, farmId });
  }

  async getStockById(id, currentUser) {
    const stock = await feedStockRepository.findById(id);
    if (!stock) throw new ApiError(404, 'Feed stock not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, stock.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this feed stock');
    }
    return stock;
  }

  async updateReorderLevel(id, reorderLevel, currentUser) {
    const stock = await feedStockRepository.findById(id);
    if (!stock) throw new ApiError(404, 'Feed stock not found');

    if (currentUser.role !== 'system_admin' && currentUser.role !== 'owner') {
      throw new ApiError(403, 'You do not have permission to update reorder level');
    }
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, stock.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }

    if (reorderLevel < 0) throw new ApiError(400, 'Reorder level must be non-negative');

    return feedStockRepository.updateReorderLevel(id, reorderLevel);
  }
}

module.exports = new FeedStockService();