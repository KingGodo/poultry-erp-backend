const prisma = require('../../../config/prisma');

class FeedTypeRepository {
  async findAll({ page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, farmId } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (farmId) {
      where.farmId = BigInt(farmId);
    }

    const [feedTypes, total] = await Promise.all([
      prisma.feedType.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          farm: { select: { id: true, name: true } },
          stock: true,
          _count: {
            select: { purchases: true, distributions: true },
          },
        },
      }),
      prisma.feedType.count({ where }),
    ]);

    return { feedTypes, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return prisma.feedType.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, name: true } },
        stock: true,
        purchases: {
          orderBy: { purchaseDate: 'desc' },
          take: 5,
          include: { supplier: { select: { id: true, name: true } } },
        },
        distributions: {
          orderBy: { distributedDate: 'desc' },
          take: 5,
          include: { run: { include: { house: true } } },
        },
      },
    });
  }

  async findByName(farmId, name) {
    return prisma.feedType.findFirst({
      where: {
        farmId: BigInt(farmId),
        name: { equals: name, mode: 'insensitive' },
      },
    });
  }

  async create(data) {
    return prisma.feedType.create({
      data,
      include: {
        farm: { select: { id: true, name: true } },
      },
    });
  }

  async update(id, data) {
    return prisma.feedType.update({
      where: { id },
      data,
      include: {
        farm: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id) {
    return prisma.feedType.delete({
      where: { id },
    });
  }
}

module.exports = new FeedTypeRepository();