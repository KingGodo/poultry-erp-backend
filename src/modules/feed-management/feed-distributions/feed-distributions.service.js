const feedDistributionRepository = require('./feed-distributions.repository');
const feedStockRepository = require('../feed-stock/feed-stock.repository');
const userRepository = require('../../users/users.repository');
const runRepository = require('../../runs/runs.repository');
const ApiError = require('../../../utils/ApiError');

class FeedDistributionService {
  async listDistributions(filters, currentUser) {
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
      throw new ApiError(403, 'You do not have permission to view feed distributions');
    }

    return feedDistributionRepository.findAll({ ...rest, farmId });
  }

  async getDistributionById(id, currentUser) {
    const distribution = await feedDistributionRepository.findById(id);
    if (!distribution) throw new ApiError(404, 'Feed distribution not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, distribution.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this feed distribution');
    }
    return distribution;
  }

  async createDistribution(data, currentUser) {
    // Permission: system_admin, owner, manager (with create permission)
    if (!['system_admin', 'owner', 'manager'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to create feed distributions');
    }

    // Verify farm access
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, data.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }

    // Verify run exists and belongs to the farm
    const run = await runRepository.findById(data.runId);
    if (!run) throw new ApiError(404, 'Run not found');
    if (run.house.farmId !== data.farmId) {
      throw new ApiError(400, 'Run does not belong to the specified farm');
    }

    // Check stock availability
    const stock = await feedStockRepository.findByFarmAndFeedType(data.farmId, data.feedTypeId);
    if (!stock || stock.quantityBags < data.quantityBags) {
      throw new ApiError(400, `Insufficient stock. Available: ${stock?.quantityBags || 0}`);
    }

    data.distributedBy = currentUser.id;

    // Use transaction to create distribution and deduct stock
    const prisma = require('../../../config/prisma');
    return prisma.$transaction(async (tx) => {
      // Create distribution
      const distribution = await tx.feedDistribution.create({
        data,
        include: {
          farm: { select: { id: true, name: true } },
          run: { include: { house: { select: { id: true, name: true } } } },
          feedType: true,
          distributor: { select: { id: true, fullName: true } },
        },
      });

      // Deduct stock
      await tx.feedStock.update({
        where: {
          farmId_feedTypeId: {
            farmId: BigInt(data.farmId),
            feedTypeId: data.feedTypeId,
          },
        },
        data: {
          quantityBags: {
            decrement: data.quantityBags,
          },
        },
      });

      return distribution;
    });
  }

  async updateDistribution(id, data, currentUser) {
    const distribution = await feedDistributionRepository.findById(id);
    if (!distribution) throw new ApiError(404, 'Feed distribution not found');

    if (currentUser.role !== 'system_admin' && currentUser.role !== 'owner') {
      throw new ApiError(403, 'You do not have permission to update feed distributions');
    }
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, distribution.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this feed distribution');
    }

    // Only allow updating non-quantity fields for simplicity
    const { quantityBags, ...updateData } = data;
    if (quantityBags !== undefined) {
      throw new ApiError(400, 'Updating quantity requires stock adjustment. Please contact admin.');
    }

    return feedDistributionRepository.update(id, updateData);
  }

  async deleteDistribution(id, currentUser) {
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete feed distributions');
    }

    const distribution = await feedDistributionRepository.findById(id);
    if (!distribution) throw new ApiError(404, 'Feed distribution not found');

    // Refund stock
    const prisma = require('../../../config/prisma');
    return prisma.$transaction(async (tx) => {
      await tx.feedStock.update({
        where: {
          farmId_feedTypeId: {
            farmId: distribution.farmId,
            feedTypeId: distribution.feedTypeId,
          },
        },
        data: {
          quantityBags: {
            increment: distribution.quantityBags,
          },
        },
      });
      await tx.feedDistribution.delete({ where: { id } });
      return true;
    });
  }

  async getDistributionsByRun(runId, currentUser) {
    // Verify run exists and user has access
    const run = await runRepository.findById(runId);
    if (!run) throw new ApiError(404, 'Run not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, run.house.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this run');
    }

    return feedDistributionRepository.findByRun(runId);
  }
}

module.exports = new FeedDistributionService();