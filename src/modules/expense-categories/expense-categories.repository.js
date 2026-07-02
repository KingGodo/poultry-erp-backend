// src/modules/expense-categories/expense-categories.repository.js
const prisma = require('../../config/prisma');

class ExpenseCategoryRepository {
  async findAll({ page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc', search, farmId } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (farmId) where.farmId = BigInt(farmId);

    // ✅ Ensure sortBy is a valid field (fallback to 'name' if invalid)
    const validSortFields = ['id', 'name', 'farmId', 'createdBy'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'name';

    const [categories, total] = await Promise.all([
      prisma.expenseCategory.findMany({
        where,
        skip,
        take,
        orderBy: { [safeSortBy]: sortOrder },
        include: {
          farm: { select: { id: true, name: true } },
          _count: { select: { expenses: true } },
        },
      }),
      prisma.expenseCategory.count({ where }),
    ]);

    return { categories, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return prisma.expenseCategory.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, name: true } },
        expenses: {
          orderBy: { expenseDate: 'desc' },
          take: 5,
          include: { batch: true },
        },
      },
    });
  }

  async findByName(farmId, name) {
    return prisma.expenseCategory.findFirst({
      where: {
        farmId: BigInt(farmId),
        name: { equals: name, mode: 'insensitive' },
      },
    });
  }

  async create(data) {
    return prisma.expenseCategory.create({
      data,
      include: { farm: { select: { id: true, name: true } } },
    });
  }

  async update(id, data) {
    return prisma.expenseCategory.update({
      where: { id },
      data,
      include: { farm: { select: { id: true, name: true } } },
    });
  }

  async delete(id) {
    return prisma.expenseCategory.delete({ where: { id } });
  }
}

module.exports = new ExpenseCategoryRepository();