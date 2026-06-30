const prisma = require('../../../config/prisma');

class MortalityRecordRepository {
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'recordedDate',
    sortOrder = 'desc',
    farmId,
    runId,
    batchId,
    reasonCodeId,
    fromDate,
    toDate,
  } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};
    if (farmId) where.farmId = BigInt(farmId);
    if (runId) where.runId = BigInt(runId);
    if (batchId) where.batchId = BigInt(batchId);
    if (reasonCodeId) where.reasonCodeId = reasonCodeId;
    if (fromDate) where.recordedDate = { gte: new Date(fromDate) };
    if (toDate) where.recordedDate = { ...where.recordedDate, lte: new Date(toDate) };

    const [records, total] = await Promise.all([
      prisma.mortalityRecord.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          farm: { select: { id: true, name: true } },
          run: { include: { house: true } },
          batch: { select: { id: true, batchCode: true, breed: true } },
          reasonCode: true,
          recorder: { select: { id: true, fullName: true } },
        },
      }),
      prisma.mortalityRecord.count({ where }),
    ]);

    return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return prisma.mortalityRecord.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, name: true } },
        run: { include: { house: true } },
        batch: { select: { id: true, batchCode: true, breed: true } },
        reasonCode: true,
        recorder: { select: { id: true, fullName: true } },
      },
    });
  }

  async create(data) {
    return prisma.mortalityRecord.create({
      data,
      include: {
        farm: { select: { id: true, name: true } },
        run: { include: { house: true } },
        batch: { select: { id: true, batchCode: true, breed: true } },
        reasonCode: true,
        recorder: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id, data) {
    return prisma.mortalityRecord.update({
      where: { id },
      data,
      include: {
        farm: { select: { id: true, name: true } },
        run: { include: { house: true } },
        batch: { select: { id: true, batchCode: true, breed: true } },
        reasonCode: true,
        recorder: { select: { id: true, fullName: true } },
      },
    });
  }

  async delete(id) {
    return prisma.mortalityRecord.delete({ where: { id } });
  }
}

module.exports = new MortalityRecordRepository();