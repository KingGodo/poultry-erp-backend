// src/modules/mortality-vaccination/vaccination-schedules/vaccination-schedules.validation.js
const Joi = require('joi');

const createScheduleSchema = Joi.object({
  farmId: Joi.number().integer().required(),
  batchId: Joi.number().integer().required(),
  vaccineId: Joi.number().integer().required(),
  scheduledDay: Joi.number().integer().min(0).required(),
  status: Joi.string().valid('pending', 'done', 'overdue', 'skipped').default('pending'),
});

const updateScheduleSchema = Joi.object({
  vaccineId: Joi.number().integer().optional(),
  scheduledDay: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('pending', 'done', 'overdue', 'skipped').optional(),
});

const updateScheduleStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'done', 'overdue', 'skipped').required(),
});

module.exports = {
  createScheduleSchema,
  updateScheduleSchema,
  updateScheduleStatusSchema,
};