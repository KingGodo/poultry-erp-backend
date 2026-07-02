// src/modules/sales/sales.repository.js
const prisma = require('../../config/prisma');

class SalesRepository {
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'saleDate',
    sortOrder = 'desc',
    farmId,
    productType,
    customerId,
    batchId,
    runId,
    fromDate,
    toDate,
    includeDeleted = false,
  } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (farmId) where.farmId = BigInt(farmId);
    if (productType) where.productType = productType;
    if (customerId) where.customerId = BigInt(customerId);
    if (batchId) where.batchId = BigInt(batchId);
    if (runId) where.runId = BigInt(runId);
    if (fromDate) where.saleDate = { gte: new Date(fromDate) };
    if (toDate) where.saleDate = { ...where.saleDate, lte: new Date(toDate) };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          farm: { select: { id: true, name: true } },
          batch: { select: { id: true, batchCode: true, breed: true } },
          run: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          recorder: { select: { id: true, fullName: true } },
        },
      }),
      prisma.sale.count({ where }),
    ]);

    return { sales, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, name: true } },
        batch: { select: { id: true, batchCode: true, breed: true } },
        run: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, contactPhone: true } },
        recorder: { select: { id: true, fullName: true } },
      },
    });
  }

  async create(data) {
    return prisma.sale.create({
      data,
      include: {
        farm: { select: { id: true, name: true } },
        batch: { select: { id: true, batchCode: true, breed: true } },
        run: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        recorder: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id, data) {
    return prisma.sale.update({
      where: { id },
      data,
      include: {
        farm: { select: { id: true, name: true } },
        batch: { select: { id: true, batchCode: true, breed: true } },
        run: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        recorder: { select: { id: true, fullName: true } },
      },
    });
  }

  async softDelete(id) {
    return prisma.sale.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getStats(farmId, fromDate, toDate) {
    const where = {
      farmId: BigInt(farmId),
      deletedAt: null,
    };
    if (fromDate) where.saleDate = { gte: new Date(fromDate) };
    if (toDate) where.saleDate = { ...where.saleDate, lte: new Date(toDate) };

    const stats = await prisma.sale.aggregate({
      where,
      _sum: {
        quantitySold: true,
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    const productStats = await prisma.sale.groupBy({
      by: ['productType'],
      where,
      _sum: {
        quantitySold: true,
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      totalSales: stats._count.id || 0,
      totalQuantity: stats._sum.quantitySold || 0,
      totalRevenue: stats._sum.totalAmount || 0,
      byProduct: productStats,
    };
  }
}

module.exports = new SalesRepository();