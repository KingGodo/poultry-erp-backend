// src/modules/batches/batches.repository.js
const prisma = require('../../config/prisma');

class BatchRepository {
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    farmId,
    status,
    batchType,
    supplierId,
    fromDate,
    toDate,
  } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};

    if (search) {
      where.OR = [
        { batchCode: { contains: search, mode: 'insensitive' } },
        { breed: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (farmId) {
      where.farmId = BigInt(farmId);
    }

    if (status) {
      where.status = status;
    }

    if (batchType) {
      where.batchType = batchType;
    }

    if (supplierId) {
      where.supplierId = BigInt(supplierId);
    }

    if (fromDate) {
      where.arrivalDate = { gte: new Date(fromDate) };
    }

    if (toDate) {
      where.arrivalDate = { ...where.arrivalDate, lte: new Date(toDate) };
    }

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
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
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              fullName: true,
            },
          },
          allocations: {
            include: {
              run: {
                include: {
                  house: true,
                },
              },
            },
          },
          _count: {
            select: {
              mortalityRecords: true,
              vaccinationSchedules: true,
              sales: true,
            },
          },
        },
      }),
      prisma.batch.count({ where }),
    ]);

    return {
      batches,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id) {
    return prisma.batch.findUnique({
      where: { id: BigInt(id) },
      include: {
        farm: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            contactPhone: true,
            contactEmail: true,
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
            run: {
              include: {
                house: true,
              },
            },
            creator: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        mortalityRecords: {
          orderBy: { recordedDate: 'desc' },
          take: 10,
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
        vaccinationSchedules: {
          include: {
            vaccine: true,
            vaccinations: true,
          },
        },
        weightRecords: {
          orderBy: { weekNumber: 'asc' },
        },
        eggCollections: {
          orderBy: { collectionDate: 'desc' },
          take: 10,
        },
        sales: {
          orderBy: { saleDate: 'desc' },
          take: 10,
          include: {
            customer: true,
          },
        },
        expenses: {
          orderBy: { expenseDate: 'desc' },
          take: 10,
          include: {
            category: true,
          },
        },
      },
    });
  }

  async create(data) {
    if (!data.totalChickCost && data.quantityReceived && data.costPerChick) {
      data.totalChickCost = data.quantityReceived * data.costPerChick;
    }
    if (!data.quantityAlive) {
      data.quantityAlive = data.quantityReceived;
    }

    return prisma.batch.create({
      data,
      include: {
        farm: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async update(id, data) {
    if (data.quantityReceived !== undefined || data.costPerChick !== undefined) {
      const current = await prisma.batch.findUnique({
        where: { id: BigInt(id) },
        select: { quantityReceived: true, costPerChick: true },
      });
      const qty = data.quantityReceived !== undefined ? data.quantityReceived : current.quantityReceived;
      const cost = data.costPerChick !== undefined ? data.costPerChick : current.costPerChick;
      data.totalChickCost = qty * cost;
    }

    return prisma.batch.update({
      where: { id: BigInt(id) },
      data,
      include: {
        farm: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async softDelete(id) {
    return prisma.batch.update({
      where: { id: BigInt(id) },
      data: { status: 'archived' },
    });
  }

  async updateStatus(id, status) {
    return prisma.batch.update({
      where: { id: BigInt(id) },
      data: { status },
    });
  }

  async updateCounts(id, counts) {
    return prisma.batch.update({
      where: { id: BigInt(id) },
      data: counts,
    });
  }

  async findByCode(farmId, batchCode) {
    return prisma.batch.findFirst({
      where: {
        farmId: BigInt(farmId),
        batchCode,
      },
    });
  }

  async findActiveBatches(farmId) {
    return prisma.batch.findMany({
      where: {
        farmId: BigInt(farmId),
        status: 'active',
      },
      orderBy: { arrivalDate: 'desc' },
    });
  }

  async getBatchStats(farmId) {
    const stats = await prisma.batch.aggregate({
      where: { farmId: BigInt(farmId) },
      _sum: {
        quantityReceived: true,
        quantityAlive: true,
        quantityDead: true,
        quantitySold: true,
        totalChickCost: true,
      },
      _count: {
        id: true,
      },
    });

    const statusCounts = await prisma.batch.groupBy({
      by: ['status'],
      where: { farmId: BigInt(farmId) },
      _count: {
        id: true,
      },
    });

    return {
      totalBatches: stats._count.id || 0,
      totalBirdsReceived: stats._sum.quantityReceived || 0,
      totalBirdsAlive: stats._sum.quantityAlive || 0,
      totalBirdsDead: stats._sum.quantityDead || 0,
      totalBirdsSold: stats._sum.quantitySold || 0,
      totalChickCost: stats._sum.totalChickCost || 0,
      statusCounts,
    };
  }
}

module.exports = new BatchRepository();