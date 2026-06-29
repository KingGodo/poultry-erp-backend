// src/modules/farms/farms.repository.js
const prisma = require('../../config/prisma');

class FarmRepository {
  /**
   * List farms with filters, pagination, sorting
   */
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    ownerId,
    status,
    userId, // for filtering farms user has access to
  } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (ownerId) {
      where.ownerId = BigInt(ownerId);
    }

    if (status !== undefined) {
      where.isActive = status === 'active';
    }

    // If userId is provided, only return farms this user has access to
    if (userId) {
      where.userFarmAccess = {
        some: { userId: BigInt(userId) },
      };
    }

    const [farms, total] = await Promise.all([
      prisma.farm.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
              role: true,
            },
          },
        },
      }),
      prisma.farm.count({ where }),
    ]);

    return {
      farms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id) {
    return prisma.farm.findUnique({
      where: { id: BigInt(id) },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            role: true,
          },
        },
        houses: true,
        batches: true,
      },
    });
  }

  async create(data) {
    return prisma.farm.create({
      data,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            role: true,
          },
        },
      },
    });
  }

  async update(id, data) {
    return prisma.farm.update({
      where: { id: BigInt(id) },
      data,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            role: true,
          },
        },
      },
    });
  }

  async softDelete(id) {
    return prisma.farm.update({
      where: { id: BigInt(id) },
      data: { isActive: false },
    });
  }

  async getUsersByFarm(farmId) {
    return prisma.userFarmAccess.findMany({
      where: { farmId: BigInt(farmId) },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        role: true,
      },
    });
  }

  async getFarmsByUser(userId) {
    return prisma.userFarmAccess.findMany({
      where: { userId: BigInt(userId) },
      include: {
        farm: true,
        role: true,
      },
    });
  }

  async updateSettings(id, settings) {
    return prisma.farm.update({
      where: { id: BigInt(id) },
      data: settings,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async countFarms() {
    return prisma.farm.count();
  }
}

module.exports = new FarmRepository();