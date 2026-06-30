// src/modules/mortality-vaccination/vaccination-schedules/vaccination-schedules.repository.js
const prisma = require('../../../config/prisma');

class VaccinationScheduleRepository {
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'scheduledDate',
    sortOrder = 'asc',
    farmId,
    batchId,
    vaccineId,
    status,
    fromDate,
    toDate,
  } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};
    if (farmId) where.farmId = BigInt(farmId);
    if (batchId) where.batchId = BigInt(batchId);
    if (vaccineId) where.vaccineId = vaccineId;
    if (status) where.status = status;
    if (fromDate) where.scheduledDate = { gte: new Date(fromDate) };
    if (toDate) where.scheduledDate = { ...where.scheduledDate, lte: new Date(toDate) };

    const [schedules, total] = await Promise.all([
      prisma.vaccinationSchedule.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          batch: {
            select: {
              id: true,
              batchCode: true,
              breed: true,
              arrivalDate: true,
              farmId: true,
            },
          },
          vaccine: {
            select: {
              id: true,
              name: true,
            },
          },
          farm: {
            select: {
              id: true,
              name: true,
            },
          },
          vaccinations: {
            include: {
              administrator: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      }),
      prisma.vaccinationSchedule.count({ where }),
    ]);

    return { schedules, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return prisma.vaccinationSchedule.findUnique({
      where: { id },
      include: {
        batch: {
          select: {
            id: true,
            batchCode: true,
            breed: true,
            arrivalDate: true,
            farmId: true,
          },
        },
        vaccine: {
          select: {
            id: true,
            name: true,
          },
        },
        farm: {
          select: {
            id: true,
            name: true,
          },
        },
        vaccinations: {
          include: {
            administrator: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });
  }

  async create(data) {
    return prisma.vaccinationSchedule.create({
      data,
      include: {
        batch: true,
        vaccine: true,
        farm: { select: { id: true, name: true } },
      },
    });
  }

  async update(id, data) {
    return prisma.vaccinationSchedule.update({
      where: { id },
      data,
      include: {
        batch: true,
        vaccine: true,
        farm: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id) {
    return prisma.vaccinationSchedule.delete({
      where: { id },
    });
  }

  async updateStatus(id, status) {
    return prisma.vaccinationSchedule.update({
      where: { id },
      data: { status },
    });
  }
}

module.exports = new VaccinationScheduleRepository();