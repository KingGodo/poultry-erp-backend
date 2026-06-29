const prisma = require('../../../config/prisma');

class FeedStockRepository {
  async findAll({ farmId, feedTypeId, lowStock = false, page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};
    if (farmId) where.farmId = BigInt(farmId);
    if (feedTypeId) where.feedTypeId = feedTypeId;
    if (lowStock) {
      where.quantityBags = { lte: prisma.feedStock.fields.reorderLevel };
    }

    const [stock, total] = await Promise.all([
      prisma.feedStock.findMany({
        where,
        skip,
        take,
        include: {
          farm: { select: { id: true, name: true } },
          feedType: true,
        },
        orderBy: { quantityBags: 'asc' },
      }),
      prisma.feedStock.count({ where }),
    ]);

    return { stock, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return prisma.feedStock.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, name: true } },
        feedType: true,
      },
    });
  }

  async findByFarmAndFeedType(farmId, feedTypeId) {
    return prisma.feedStock.findUnique({
      where: {
        farmId_feedTypeId: {
          farmId: BigInt(farmId),
          feedTypeId,
        },
      },
    });
  }

  async update(id, data) {
    return prisma.feedStock.update({
      where: { id },
      data,
    });
  }

  async updateReorderLevel(id, reorderLevel) {
    return prisma.feedStock.update({
      where: { id },
      data: { reorderLevel },
    });
  }
}

module.exports = new FeedStockRepository();