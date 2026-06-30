const prisma = require('../../../config/prisma');

class MortalityReasonRepository {
  async findAll({ page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, farmId } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (farmId) where.farmId = BigInt(farmId);

    const [reasons, total] = await Promise.all([
      prisma.mortalityReason.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          farm: { select: { id: true, name: true } },
          _count: { select: { records: true } },
        },
      }),
      prisma.mortalityReason.count({ where }),
    ]);

    return { reasons, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return prisma.mortalityReason.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, name: true } },
        records: {
          orderBy: { recordedDate: 'desc' },
          take: 5,
          include: { run: true, batch: true },
        },
      },
    });
  }

  async findByCode(farmId, code) {
    return prisma.mortalityReason.findFirst({
      where: {
        farmId: BigInt(farmId),
        code: { equals: code, mode: 'insensitive' },
      },
    });
  }

  async create(data) {
    return prisma.mortalityReason.create({
      data,
      include: { farm: { select: { id: true, name: true } } },
    });
  }

  async update(id, data) {
    return prisma.mortalityReason.update({
      where: { id },
      data,
      include: { farm: { select: { id: true, name: true } } },
    });
  }

  async delete(id) {
    return prisma.mortalityReason.delete({ where: { id } });
  }
}

module.exports = new MortalityReasonRepository();