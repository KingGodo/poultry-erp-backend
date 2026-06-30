// src/modules/mortality-vaccination/vaccines/vaccines.repository.js
const prisma = require('../../../config/prisma');

class VaccineRepository {
  /**
   * List vaccines with pagination, sorting, and filters.
   */
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    farmId,
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

    const [vaccines, total] = await Promise.all([
      prisma.vaccine.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          farm: { select: { id: true, name: true } },
          _count: { select: { schedules: true } },
        },
      }),
      prisma.vaccine.count({ where }),
    ]);

    return { vaccines, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get a single vaccine by ID.
   */
  async findById(id) {
    return prisma.vaccine.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, name: true } },
        schedules: {
          include: { batch: { select: { id: true, batchCode: true, breed: true } } },
        },
      },
    });
  }

  /**
   * Find a vaccine by name within a farm (for uniqueness check).
   */
  async findByName(farmId, name) {
    return prisma.vaccine.findFirst({
      where: {
        farmId: BigInt(farmId),
        name: { equals: name, mode: 'insensitive' },
      },
    });
  }

  /**
   * Create a new vaccine.
   */
  async create(data) {
    return prisma.vaccine.create({
      data,
      include: {
        farm: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Update an existing vaccine.
   */
  async update(id, data) {
    return prisma.vaccine.update({
      where: { id },
      data,
      include: {
        farm: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Delete a vaccine (hard delete).
   */
  async delete(id) {
    return prisma.vaccine.delete({ where: { id } });
  }
}

module.exports = new VaccineRepository();