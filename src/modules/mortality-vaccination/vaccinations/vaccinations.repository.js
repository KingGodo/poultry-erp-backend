// src/modules/mortality-vaccination/vaccinations/vaccinations.repository.js
const prisma = require('../../../config/prisma');

class VaccinationRepository {
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'administeredDate',
    sortOrder = 'desc',
    farmId,
    batchId,
    scheduleId,
    runId,
    fromDate,
    toDate,
  } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};
    if (farmId) where.farmId = BigInt(farmId);
    if (batchId) where.schedule = { batchId: BigInt(batchId) };
    if (scheduleId) where.scheduleId = BigInt(scheduleId);
    if (runId) where.runId = BigInt(runId);
    if (fromDate) where.administeredDate = { gte: new Date(fromDate) };
    if (toDate) where.administeredDate = { ...where.administeredDate, lte: new Date(toDate) };

    const [vaccinations, total] = await Promise.all([
      prisma.vaccination.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          schedule: {
            include: {
              vaccine: { select: { id: true, name: true } },
              batch: { select: { id: true, batchCode: true, breed: true } },
            },
          },
          run: {
            include: { house: { select: { id: true, name: true } } },
          },
          administrator: {
            select: { id: true, fullName: true },
          },
          farm: { select: { id: true, name: true } },
        },
      }),
      prisma.vaccination.count({ where }),
    ]);

    return { vaccinations, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return prisma.vaccination.findUnique({
      where: { id },
      include: {
        schedule: {
          include: {
            vaccine: { select: { id: true, name: true } },
            batch: { select: { id: true, batchCode: true, breed: true } },
          },
        },
        run: {
          include: { house: { select: { id: true, name: true } } },
        },
        administrator: {
          select: { id: true, fullName: true },
        },
        farm: { select: { id: true, name: true } },
      },
    });
  }

  async create(data) {
    return prisma.vaccination.create({
      data,
      include: {
        schedule: { include: { vaccine: true, batch: true } },
        run: { include: { house: true } },
        administrator: { select: { id: true, fullName: true } },
        farm: { select: { id: true, name: true } },
      },
    });
  }

  async update(id, data) {
    return prisma.vaccination.update({
      where: { id },
      data,
      include: {
        schedule: { include: { vaccine: true, batch: true } },
        run: { include: { house: true } },
        administrator: { select: { id: true, fullName: true } },
        farm: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id) {
    return prisma.vaccination.delete({ where: { id } });
  }
}

module.exports = new VaccinationRepository();