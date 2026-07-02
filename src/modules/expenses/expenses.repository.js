// src/modules/expenses/expenses.repository.js
const prisma = require('../../config/prisma');

class ExpenseRepository {
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'expenseDate',
    sortOrder = 'desc',
    farmId,
    categoryId,
    batchId,
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
    if (categoryId) where.categoryId = categoryId;
    if (batchId) where.batchId = BigInt(batchId);
    if (fromDate) where.expenseDate = { gte: new Date(fromDate) };
    if (toDate) where.expenseDate = { ...where.expenseDate, lte: new Date(toDate) };

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          farm: { select: { id: true, name: true } },
          category: true,
          batch: { select: { id: true, batchCode: true, breed: true } },
          recorder: { select: { id: true, fullName: true } },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return { expenses, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return prisma.expense.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, name: true } },
        category: true,
        batch: { select: { id: true, batchCode: true, breed: true } },
        recorder: { select: { id: true, fullName: true } },
      },
    });
  }

  async create(data) {
    return prisma.expense.create({
      data,
      include: {
        farm: { select: { id: true, name: true } },
        category: true,
        batch: { select: { id: true, batchCode: true, breed: true } },
        recorder: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id, data) {
    return prisma.expense.update({
      where: { id },
      data,
      include: {
        farm: { select: { id: true, name: true } },
        category: true,
        batch: { select: { id: true, batchCode: true, breed: true } },
        recorder: { select: { id: true, fullName: true } },
      },
    });
  }

  async softDelete(id) {
    return prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getStats(farmId, fromDate, toDate) {
    const where = {
      farmId: BigInt(farmId),
      deletedAt: null,
    };
    if (fromDate) where.expenseDate = { gte: new Date(fromDate) };
    if (toDate) where.expenseDate = { ...where.expenseDate, lte: new Date(toDate) };

    const stats = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    const categoryStats = await prisma.expense.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    // Fetch category names
    const categoryIds = categoryStats.map(c => c.categoryId);
    const categories = await prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryMap = {};
    categories.forEach(c => { categoryMap[c.id] = c.name; });

    const byCategory = categoryStats.map(c => ({
      categoryId: c.categoryId,
      categoryName: categoryMap[c.categoryId] || 'Unknown',
      totalAmount: c._sum.amount || 0,
      count: c._count.id || 0,
    }));

    return {
      totalExpenses: stats._count.id || 0,
      totalAmount: stats._sum.amount || 0,
      byCategory,
    };
  }
}

module.exports = new ExpenseRepository();