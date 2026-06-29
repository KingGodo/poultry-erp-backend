const prisma = require('../../../config/prisma');

class FeedPurchaseRepository {
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'purchaseDate',
    sortOrder = 'desc',
    farmId,
    feedTypeId,
    supplierId,
    fromDate,
    toDate,
  } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};
    if (farmId) where.farmId = BigInt(farmId);
    if (feedTypeId) where.feedTypeId = feedTypeId;
    if (supplierId) where.supplierId = BigInt(supplierId);
    if (fromDate) where.purchaseDate = { gte: new Date(fromDate) };
    if (toDate) where.purchaseDate = { ...where.purchaseDate, lte: new Date(toDate) };

    const [purchases, total] = await Promise.all([
      prisma.feedPurchase.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          farm: { select: { id: true, name: true } },
          feedType: true,
          supplier: { select: { id: true, name: true } },
          creator: { select: { id: true, fullName: true } },
        },
      }),
      prisma.feedPurchase.count({ where }),
    ]);

    return { purchases, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return prisma.feedPurchase.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, name: true } },
        feedType: true,
        supplier: { select: { id: true, name: true, contactPhone: true } },
        creator: { select: { id: true, fullName: true } },
      },
    });
  }

  async create(data) {
    return prisma.feedPurchase.create({
      data,
      include: {
        farm: { select: { id: true, name: true } },
        feedType: true,
        supplier: { select: { id: true, name: true } },
        creator: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id, data) {
    return prisma.feedPurchase.update({
      where: { id },
      data,
      include: {
        farm: { select: { id: true, name: true } },
        feedType: true,
        supplier: { select: { id: true, name: true } },
        creator: { select: { id: true, fullName: true } },
      },
    });
  }

  async delete(id) {
    return prisma.feedPurchase.delete({
      where: { id },
    });
  }
}

module.exports = new FeedPurchaseRepository();