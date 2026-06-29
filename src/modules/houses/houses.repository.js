// src/modules/houses/houses.repository.js
const prisma = require('../../config/prisma');

class HouseRepository {
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    farmId,
    isActive,
  } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (farmId) {
      where.farmId = BigInt(farmId);
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [houses, total] = await Promise.all([
      prisma.house.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          farm: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          runs: {
            select: {
              id: true,
              name: true,
              capacity: true,
              currentBirds: true,
              status: true,
            },
          },
        },
      }),
      prisma.house.count({ where }),
    ]);

    return {
      houses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id) {
    return prisma.house.findUnique({
      where: { id: BigInt(id) },
      include: {
        farm: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        runs: {
          include: {
            allocations: true,
            feedDistributions: true,
            mortalityRecords: true,
          },
        },
      },
    });
  }

  async create(data) {
    return prisma.house.create({
      data,
      include: {
        farm: {
          select: {
            id: true,
            name: true,
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
    return prisma.house.update({
      where: { id: BigInt(id) },
      data,
      include: {
        farm: {
          select: {
            id: true,
            name: true,
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

  async softDelete(id) {
    return prisma.house.update({
      where: { id: BigInt(id) },
      data: { isActive: false },
    });
  }

  async getRunsByHouse(houseId) {
    return prisma.run.findMany({
      where: { houseId: BigInt(houseId) },
      include: {
        allocations: true,
        feedDistributions: true,
        mortalityRecords: true,
      },
    });
  }
}

module.exports = new HouseRepository();