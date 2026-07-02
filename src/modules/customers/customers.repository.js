// src/modules/customers/customers.repository.js
const prisma = require('../../config/prisma');

class CustomerRepository {
  async findAll({ page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, farmId } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (farmId) where.farmId = BigInt(farmId);

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          farm: { select: { id: true, name: true } },
          _count: { select: { sales: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return { customers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, name: true } },
        sales: {
          orderBy: { saleDate: 'desc' },
          take: 5,
          include: { batch: true, run: true },
        },
      },
    });
  }

  async create(data) {
    return prisma.customer.create({
      data,
      include: { farm: { select: { id: true, name: true } } },
    });
  }

  async update(id, data) {
    return prisma.customer.update({
      where: { id },
      data,
      include: { farm: { select: { id: true, name: true } } },
    });
  }

  async delete(id) {
    return prisma.customer.delete({ where: { id } });
  }
}

module.exports = new CustomerRepository();