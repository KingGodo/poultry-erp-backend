// src/modules/notifications/notifications.service.js
const notificationRepository = require('./notifications.repository');
const userRepository = require('../users/users.repository');
const ApiError = require('../../utils/ApiError');

class NotificationService {
  async listNotifications(filters, currentUser) {
    let { farmId, ...rest } = filters;

    // system_admin can see all farms; others only their own farms
    if (currentUser.role !== 'system_admin') {
      const userFarms = await userRepository.findUserFarms(currentUser.id);
      const farmIds = userFarms.map(f => f.farmId);
      if (!farmId) {
        if (farmIds.length > 0) farmId = farmIds[0];
      } else {
        const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
        if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
      }
    }

    // If userId is not provided, default to current user (so they only see their own notifications)
    // But if system_admin requests without userId, they see all (we'll not override)
    // For owner/manager/staff, we force userId = currentUser.id
    if (currentUser.role !== 'system_admin') {
      rest.userId = currentUser.id;
    }

    return notificationRepository.findAll({ ...rest, farmId });
  }

  async getNotificationById(id, currentUser) {
    const notification = await notificationRepository.findById(id);
    if (!notification) throw new ApiError(404, 'Notification not found');

    // Check access
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, notification.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this notification');
      // Also check if it belongs to the user
      if (notification.userId && notification.userId !== currentUser.id) {
        throw new ApiError(403, 'This notification does not belong to you');
      }
    }
    return notification;
  }

  async createNotification(data, currentUser) {
    // Only system_admin can create notifications via API
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can create notifications');
    }

    // Validate farm exists
    const farm = await prisma.farm.findUnique({ where: { id: BigInt(data.farmId) } });
    if (!farm) throw new ApiError(404, 'Farm not found');

    // If userId is provided, ensure user belongs to the farm
    if (data.userId) {
      const hasAccess = await userRepository.hasFarmAccess(data.userId, data.farmId);
      if (!hasAccess) throw new ApiError(400, 'User does not have access to this farm');
    }

    // Type must be one of the allowed values
    const validTypes = ['vaccination_due', 'low_stock', 'mortality_spike', 'approval_request', 'other'];
    if (!validTypes.includes(data.type)) {
      throw new ApiError(400, `Invalid type. Allowed: ${validTypes.join(', ')}`);
    }

    return notificationRepository.create(data);
  }

  async markAsRead(id, currentUser) {
    const notification = await notificationRepository.findById(id);
    if (!notification) throw new ApiError(404, 'Notification not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, notification.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this notification');
      if (notification.userId && notification.userId !== currentUser.id) {
        throw new ApiError(403, 'This notification does not belong to you');
      }
    }

    return notificationRepository.update(id, { isRead: true });
  }

  async markAllAsRead(farmId, currentUser) {
    // Allow marking all for the farm the user has access to
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }

    return notificationRepository.markAllAsRead(farmId, currentUser.id);
  }

  async getUnreadCount(farmId, currentUser) {
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }
    return notificationRepository.countUnread(farmId, currentUser.id);
  }

  async deleteNotification(id, currentUser) {
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete notifications');
    }
    const notification = await notificationRepository.findById(id);
    if (!notification) throw new ApiError(404, 'Notification not found');
    return notificationRepository.delete(id);
  }

  // ----- Auto‑generation methods (called by cron job) -----
  async generateLowFeedStockNotifications() {
    // Find all feed stock items where quantity <= reorderLevel
    const lowStock = await prisma.feedStock.findMany({
      where: {
        quantityBags: { lte: prisma.feedStock.fields.reorderLevel },
      },
      include: { farm: true, feedType: true },
    });

    for (const item of lowStock) {
      await this.createSystemNotification({
        farmId: item.farmId,
        userId: null, // broadcast to all users of the farm
        type: 'low_stock',
        title: 'Low Feed Stock Alert',
        message: `Feed type "${item.feedType.name}" is low. Current stock: ${item.quantityBags} bags (reorder level: ${item.reorderLevel}).`,
        relatedEntityType: 'feed_stock',
        relatedEntityId: item.id,
      });
    }
  }

  async generateLowInventoryNotifications() {
    const lowItems = await prisma.inventoryItem.findMany({
      where: {
        quantity: { lte: prisma.inventoryItem.fields.reorderLevel },
      },
      include: { farm: true },
    });

    for (const item of lowItems) {
      await this.createSystemNotification({
        farmId: item.farmId,
        userId: null,
        type: 'low_stock',
        title: 'Low Inventory Stock Alert',
        message: `Inventory item "${item.name}" is low. Current stock: ${item.quantity} ${item.unit} (reorder level: ${item.reorderLevel}).`,
        relatedEntityType: 'inventory_item',
        relatedEntityId: item.id,
      });
    }
  }

  async generateUpcomingVaccinationNotifications() {
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    const schedules = await prisma.vaccinationSchedule.findMany({
      where: {
        scheduledDate: { gte: today, lte: threeDaysLater },
        status: 'pending',
      },
      include: {
        batch: { include: { farm: true } },
        vaccine: true,
      },
    });

    for (const schedule of schedules) {
      await this.createSystemNotification({
        farmId: schedule.batch.farmId,
        userId: null,
        type: 'vaccination_due',
        title: 'Vaccination Due Soon',
        message: `Vaccination for ${schedule.vaccine.name} is scheduled on ${schedule.scheduledDate.toDateString()} for batch ${schedule.batch.batchCode}.`,
        relatedEntityType: 'vaccination_schedule',
        relatedEntityId: schedule.id,
      });
    }
  }

  // Helper to create a notification (used by auto‑generation and API)
  async createSystemNotification(data) {
    // If userId is null, we broadcast to all users with access to the farm.
    // For simplicity, we create a notification for each user of the farm.
    // But to avoid spam, we could just create one and let users see it via farm filter.
    // We'll create a single notification with userId = null, meaning it's farm-wide.
    // The repository will allow null userId.
    return notificationRepository.create({
      farmId: BigInt(data.farmId),
      userId: data.userId ? BigInt(data.userId) : null,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedEntityType: data.relatedEntityType,
      relatedEntityId: data.relatedEntityId ? BigInt(data.relatedEntityId) : null,
      isRead: false,
    });
  }
}

module.exports = new NotificationService();