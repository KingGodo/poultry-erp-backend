const feedPurchaseRepository = require('./feed-purchases.repository');
const feedStockRepository = require('../feed-stock/feed-stock.repository');
const userRepository = require('../../users/users.repository');
const ApiError = require('../../../utils/ApiError');
const prisma = require('../../../config/prisma'); // ✅ import once at top

class FeedPurchaseService {
  async listPurchases(filters, currentUser) {
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
      throw new ApiError(403, 'You do not have permission to view feed purchases');
    }

    return feedPurchaseRepository.findAll({ ...rest, farmId });
  }

  async getPurchaseById(id, currentUser) {
    const purchase = await feedPurchaseRepository.findById(id);
    if (!purchase) throw new ApiError(404, 'Feed purchase not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, purchase.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this feed purchase');
    }
    return purchase;
  }

  async createPurchase(data, currentUser) {
    // ✅ Convert purchaseDate to Date object
    if (data.purchaseDate) {
      data.purchaseDate = new Date(data.purchaseDate);
      if (isNaN(data.purchaseDate.getTime())) {
        throw new ApiError(400, 'Invalid purchase date format');
      }
    } else {
      // Default to today if not provided
      data.purchaseDate = new Date();
    }

    if (currentUser.role !== 'system_admin' && currentUser.role !== 'owner') {
      throw new ApiError(403, 'You do not have permission to create feed purchases');
    }

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, data.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }

    data.createdBy = currentUser.id;

    return prisma.$transaction(async (tx) => {
      const purchase = await tx.feedPurchase.create({
        data,
        include: {
          farm: { select: { id: true, name: true } },
          feedType: true,
          supplier: { select: { id: true, name: true } },
          creator: { select: { id: true, fullName: true } },
        },
      });

      // Update or create feed stock
      const existingStock = await tx.feedStock.findUnique({
        where: {
          farmId_feedTypeId: {
            farmId: BigInt(data.farmId),
            feedTypeId: data.feedTypeId,
          },
        },
      });

      if (existingStock) {
        await tx.feedStock.update({
          where: {
            farmId_feedTypeId: {
              farmId: BigInt(data.farmId),
              feedTypeId: data.feedTypeId,
            },
          },
          data: {
            quantityBags: existingStock.quantityBags + data.quantityBags,
          },
        });
      } else {
        await tx.feedStock.create({
          data: {
            farmId: BigInt(data.farmId),
            feedTypeId: data.feedTypeId,
            quantityBags: data.quantityBags,
            reorderLevel: 5,
          },
        });
      }

      return purchase;
    });
  }

  async updatePurchase(id, data, currentUser) {
    // ✅ Convert purchaseDate to Date object if provided
    if (data.purchaseDate) {
      data.purchaseDate = new Date(data.purchaseDate);
      if (isNaN(data.purchaseDate.getTime())) {
        throw new ApiError(400, 'Invalid purchase date format');
      }
    }

    const purchase = await feedPurchaseRepository.findById(id);
    if (!purchase) throw new ApiError(404, 'Feed purchase not found');

    if (currentUser.role !== 'system_admin' && currentUser.role !== 'owner') {
      throw new ApiError(403, 'You do not have permission to update feed purchases');
    }
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, purchase.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this feed purchase');
    }

    // Quantity changes are not allowed (to avoid complex stock adjustments)
    const { quantityBags, ...updateData } = data;
    if (quantityBags !== undefined) {
      throw new ApiError(400, 'Updating quantity requires stock adjustment. Please contact admin.');
    }

    return feedPurchaseRepository.update(id, updateData);
  }

  async deletePurchase(id, currentUser) {
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete feed purchases');
    }

    const purchase = await feedPurchaseRepository.findById(id);
    if (!purchase) throw new ApiError(404, 'Feed purchase not found');

    return prisma.$transaction(async (tx) => {
      const stock = await tx.feedStock.findUnique({
        where: {
          farmId_feedTypeId: {
            farmId: purchase.farmId,
            feedTypeId: purchase.feedTypeId,
          },
        },
      });
      if (stock) {
        await tx.feedStock.update({
          where: {
            farmId_feedTypeId: {
              farmId: purchase.farmId,
              feedTypeId: purchase.feedTypeId,
            },
          },
          data: {
            quantityBags: stock.quantityBags - purchase.quantityBags,
          },
        });
      }
      await tx.feedPurchase.delete({ where: { id } });
      return true;
    });
  }
}

module.exports = new FeedPurchaseService();