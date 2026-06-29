const prisma = require('../../../config/prisma');

class FeedDistributionRepository {
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'distributedDate',
    sortOrder = 'desc',
    farmId,
    runId,
    feedTypeId,
    fromDate,
    toDate,
  } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};
    if (farmId) where.farmId = BigInt(farmId);
    if (runId) where.runId = BigInt(runId);
    if (feedTypeId) where.feedTypeId = feedTypeId;
    if (fromDate) where.distributedDate = { gte: new Date(fromDate) };
    if (toDate) where.distributedDate = { ...where.distributedDate, lte: new Date(toDate) };

    const [distributions, total] = await Promise.all([
      prisma.feedDistribution.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          farm: { select: { id: true, name: true } },
          run: {
            include: { house: { select: { id: true, name: true } } },
          },
          feedType: true,
          distributor: { select: { id: true, fullName: true } },
        },
      }),
      prisma.feedDistribution.count({ where }),
    ]);

    return { distributions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return prisma.feedDistribution.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, name: true } },
        run: {
          include: { house: { select: { id: true, name: true } } },
        },
        feedType: true,
        distributor: { select: { id: true, fullName: true } },
      },
    });
  }

  async create(data) {
    return prisma.feedDistribution.create({
      data,
      include: {
        farm: { select: { id: true, name: true } },
        run: {
          include: { house: { select: { id: true, name: true } } },
        },
        feedType: true,
        distributor: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id, data) {
    return prisma.feedDistribution.update({
      where: { id },
      data,
      include: {
        farm: { select: { id: true, name: true } },
        run: {
          include: { house: { select: { id: true, name: true } } },
        },
        feedType: true,
        distributor: { select: { id: true, fullName: true } },
      },
    });
  }

  async delete(id) {
    return prisma.feedDistribution.delete({
      where: { id },
    });
  }

  async findByRun(runId) {
    return prisma.feedDistribution.findMany({
      where: { runId: BigInt(runId) },
      orderBy: { distributedDate: 'desc' },
      include: {
        feedType: true,
        distributor: { select: { id: true, fullName: true } },
      },
    });
  }
}

module.exports = new FeedDistributionRepository();