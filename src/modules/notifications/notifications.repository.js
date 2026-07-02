// src/modules/notifications/notifications.repository.js
const prisma = require('../../config/prisma');

class NotificationRepository {
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    farmId,
    userId,
    isRead,
    type,
    fromDate,
    toDate,
  } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = {};
    if (farmId) where.farmId = BigInt(farmId);
    if (userId) where.userId = BigInt(userId);
    if (isRead !== undefined) where.isRead = isRead;
    if (type) where.type = type;
    if (fromDate) where.createdAt = { gte: new Date(fromDate) };
    if (toDate) where.createdAt = { ...where.createdAt, lte: new Date(toDate) };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          farm: { select: { id: true, name: true } },
          user: { select: { id: true, fullName: true } },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    return prisma.notification.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, name: true } },
        user: { select: { id: true, fullName: true } },
      },
    });
  }

  async create(data) {
    return prisma.notification.create({
      data,
      include: {
        farm: { select: { id: true, name: true } },
        user: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id, data) {
    return prisma.notification.update({
      where: { id },
      data,
      include: {
        farm: { select: { id: true, name: true } },
        user: { select: { id: true, fullName: true } },
      },
    });
  }

  async delete(id) {
    return prisma.notification.delete({ where: { id } });
  }

  async countUnread(farmId, userId) {
    const where = { isRead: false };
    if (farmId) where.farmId = BigInt(farmId);
    if (userId) where.userId = BigInt(userId);
    return prisma.notification.count({ where });
  }

  async markAllAsRead(farmId, userId) {
    return prisma.notification.updateMany({
      where: {
        farmId: BigInt(farmId),
        userId: BigInt(userId),
        isRead: false,
      },
      data: { isRead: true },
    });
  }
}

module.exports = new NotificationRepository();