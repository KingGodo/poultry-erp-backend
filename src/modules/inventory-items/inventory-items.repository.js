// src/modules/inventory-items/inventory-items.repository.js
const prisma = require('../../config/prisma');

class InventoryItemRepository {
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'name',
    sortOrder = 'asc',
    search,
    farmId,
    category,
    lowStock = false,
  } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (farmId) where.farmId = BigInt(farmId);
    if (category) where.category = category;
    if (lowStock) {
      where.quantity = { lte: prisma.inventoryItem.fields.reorderLevel };
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          farm: { select: { id: true, name: true } },
          _count: { select: { transactions: true } },
        },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, name: true } },
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 10,
          include: { recorder: { select: { id: true, fullName: true } } },
        },
      },
    });
  }

  async findByName(farmId, name) {
    return prisma.inventoryItem.findFirst({
      where: {
        farmId: BigInt(farmId),
        name: { equals: name, mode: 'insensitive' },
      },
    });
  }

  async create(data) {
    return prisma.inventoryItem.create({
      data,
      include: { farm: { select: { id: true, name: true } } },
    });
  }

  async update(id, data) {
    return prisma.inventoryItem.update({
      where: { id },
      data,
      include: { farm: { select: { id: true, name: true } } },
    });
  }

  async delete(id) {
    return prisma.inventoryItem.delete({ where: { id } });
  }
}

module.exports = new InventoryItemRepository();