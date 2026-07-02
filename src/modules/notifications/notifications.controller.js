// src/modules/notifications/notifications.controller.js
const notificationService = require('./notifications.service');
const ApiResponse = require('../../utils/ApiResponse');

class NotificationController {
  async listNotifications(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, farmId, isRead, type, fromDate, toDate } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
        farmId: farmId ? parseInt(farmId) : undefined,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        type,
        fromDate,
        toDate,
      };
      const result = await notificationService.listNotifications(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Notifications retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getNotification(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await notificationService.getNotificationById(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, notification, 'Notification retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createNotification(req, res, next) {
    try {
      const notification = await notificationService.createNotification(req.body, req.user);
      res.status(201).json(new ApiResponse(201, notification, 'Notification created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, notification, 'Notification marked as read'));
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const { farmId } = req.params;
      await notificationService.markAllAsRead(parseInt(farmId), req.user);
      res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const { farmId } = req.params;
      const count = await notificationService.getUnreadCount(parseInt(farmId), req.user);
      res.status(200).json(new ApiResponse(200, { count }, 'Unread count retrieved'));
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      await notificationService.deleteNotification(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, null, 'Notification deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();