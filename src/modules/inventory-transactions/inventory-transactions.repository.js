// src/modules/inventory-transactions/inventory-transactions.repository.js
const prisma = require('../../config/prisma');

class InventoryTransactionRepository {
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'transactionDate',
    sortOrder = 'desc',
    itemId,
    farmId,
    transactionType,
    fromDate,
    toDate,
  } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};
    if (itemId) where.inventoryItemId = BigInt(itemId);
    if (farmId) {
      where.item = { farmId: BigInt(farmId) };
    }
    if (transactionType) where.transactionType = transactionType;
    if (fromDate) where.transactionDate = { gte: new Date(fromDate) };
    if (toDate) where.transactionDate = { ...where.transactionDate, lte: new Date(toDate) };

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          item: { select: { id: true, name: true, unit: true } },
          recorder: { select: { id: true, fullName: true } },
        },
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);

    return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return prisma.inventoryTransaction.findUnique({
      where: { id },
      include: {
        item: { select: { id: true, name: true, unit: true } },
        recorder: { select: { id: true, fullName: true } },
      },
    });
  }

  async create(data) {
    return prisma.inventoryTransaction.create({
      data,
      include: {
        item: { select: { id: true, name: true, unit: true } },
        recorder: { select: { id: true, fullName: true } },
      },
    });
  }

  async delete(id) {
    return prisma.inventoryTransaction.delete({ where: { id } });
  }
}

module.exports = new InventoryTransactionRepository();