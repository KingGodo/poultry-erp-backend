// src/modules/batch-allocations/allocations.repository.js
const prisma = require('../../config/prisma');

class AllocationRepository {
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'allocatedDate',
    sortOrder = 'desc',
    batchId,
    runId,
    farmId,
  } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};
    if (batchId) where.batchId = BigInt(batchId);
    if (runId) where.runId = BigInt(runId);
    if (farmId) {
      where.batch = { farmId: BigInt(farmId) };
    }

    const [allocations, total] = await Promise.all([
      prisma.batchAllocation.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          batch: {
            include: {
              farm: {
                select: { id: true, name: true },
              },
            },
          },
          run: {
            include: {
              house: {
                select: { id: true, name: true },
              },
            },
          },
          creator: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.batchAllocation.count({ where }),
    ]);

    return {
      allocations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id) {
    return prisma.batchAllocation.findUnique({
      where: { id: BigInt(id) },
      include: {
        batch: {
          include: {
            farm: {
              select: { id: true, name: true },
            },
          },
        },
        run: {
          include: {
            house: {
              select: { id: true, name: true },
            },
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

  async create(data) {
    return prisma.batchAllocation.create({
      data: {
        batchId: BigInt(data.batchId),
        runId: BigInt(data.runId),
        quantity: data.quantity,
        allocatedDate: data.allocatedDate || new Date(),
        createdBy: data.createdBy ? BigInt(data.createdBy) : undefined,
      },
      include: {
        batch: true,
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
    });
  }

  async update(id, data) {
    return prisma.batchAllocation.update({
      where: { id: BigInt(id) },
      data: {
        quantity: data.quantity,
        allocatedDate: data.allocatedDate,
      },
      include: {
        batch: true,
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
    });
  }

  async delete(id) {
    return prisma.batchAllocation.delete({
      where: { id: BigInt(id) },
    });
  }

  async findByBatch(batchId) {
    return prisma.batchAllocation.findMany({
      where: { batchId: BigInt(batchId) },
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
    });
  }

  async findByRun(runId) {
    return prisma.batchAllocation.findMany({
      where: { runId: BigInt(runId) },
      include: {
        batch: {
          include: {
            farm: {
              select: { id: true, name: true },
            },
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
}

module.exports = new AllocationRepository();