// src/modules/notifications/notifications.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./notifications.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { createNotificationSchema } = require('./notifications.validation');

router.use(authenticate);

router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_notifications']),
  controller.listNotifications
);

router.get(
  '/unread-count/:farmId',
  authorize('system_admin', 'owner', 'manager', ['view_notifications']),
  controller.getUnreadCount
);

router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_notifications']),
  controller.getNotification
);

router.post(
  '/',
  authorize('system_admin', ['manage_notifications']),
  validate(createNotificationSchema),
  controller.createNotification
);

router.patch(
  '/:id/read',
  authorize('system_admin', 'owner', 'manager', ['view_notifications']),
  controller.markAsRead
);

router.patch(
  '/read-all/:farmId',
  authorize('system_admin', 'owner', 'manager', ['view_notifications']),
  controller.markAllAsRead
);

router.delete(
  '/:id',
  authorize(['delete_notification']),
  controller.deleteNotification
);

module.exports = router;