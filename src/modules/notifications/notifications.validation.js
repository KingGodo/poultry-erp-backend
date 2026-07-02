// src/modules/notifications/notifications.validation.js
const Joi = require('joi');

const createNotificationSchema = Joi.object({
  farmId: Joi.number().integer().required(),
  userId: Joi.number().integer().optional().allow(null),
  type: Joi.string().valid('vaccination_due', 'low_stock', 'mortality_spike', 'approval_request', 'other').required(),
  title: Joi.string().required().max(150),
  message: Joi.string().required(),
  relatedEntityType: Joi.string().optional().max(50),
  relatedEntityId: Joi.number().integer().optional().allow(null),
});

// No update schema because updates are only mark read (via PATCH)
module.exports = {
  createNotificationSchema,
};