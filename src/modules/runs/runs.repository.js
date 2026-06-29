// src/modules/runs/runs.repository.js
const prisma = require('../../config/prisma');

class RunRepository {
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    houseId,
    farmId,
    status,
    runType,
    minCapacity,
    maxCapacity,
    hasBirds = false,
  } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (houseId) {
      where.houseId = BigInt(houseId);
    }

    if (farmId) {
      where.house = { farmId: BigInt(farmId) };
    }

    if (status) {
      where.status = status;
    }

    if (runType) {
      where.runType = runType;
    }

    if (minCapacity) {
      where.capacity = { gte: parseInt(minCapacity) };
    }

    if (maxCapacity) {
      where.capacity = { lte: parseInt(maxCapacity) };
    }

    if (hasBirds) {
      where.currentBirds = { gt: 0 };
    }

    const [runs, total] = await Promise.all([
      prisma.run.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          house: {
            include: {
              farm: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          allocations: true,
          feedDistributions: {
            take: 5,
            orderBy: { distributedDate: 'desc' },
          },
          mortalityRecords: {
            take: 5,
            orderBy: { recordedDate: 'desc' },
          },
        },
      }),
      prisma.run.count({ where }),
    ]);

    return {
      runs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id) {
    return prisma.run.findUnique({
      where: { id: BigInt(id) },
      include: {
        house: {
          include: {
            farm: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        allocations: {
          include: {
            batch: true,
          },
        },
        feedDistributions: {
          include: {
            feedType: true,
            distributor: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        mortalityRecords: {
          include: {
            reasonCode: true,
            recorder: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        vaccinations: true,
        weightRecords: true,
        eggCollections: true,
        sales: true,
      },
    });
  }

  async create(data) {
    return prisma.run.create({
      data,
      include: {
        house: {
          include: {
            farm: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id, data) {
    return prisma.run.update({
      where: { id: BigInt(id) },
      data,
      include: {
        house: {
          include: {
            farm: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async updateStatus(id, status) {
    return prisma.run.update({
      where: { id: BigInt(id) },
      data: { status },
    });
  }

  async updateBirds(id, count) {
    return prisma.run.update({
      where: { id: BigInt(id) },
      data: { currentBirds: count },
    });
  }

  async softDelete(id) {
    // We'll just set status to empty
    return prisma.run.update({
      where: { id: BigInt(id) },
      data: { status: 'empty' },
    });
  }
}

module.exports = new RunRepository();