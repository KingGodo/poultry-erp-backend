// src/modules/batches/batches.validation.js
const Joi = require('joi');

const createBatchSchema = Joi.object({
  farmId: Joi.number().required(),
  batchCode: Joi.string().required().max(30),
  breed: Joi.string().required().max(100),
  batchType: Joi.string().valid('broiler', 'layer', 'breeder', 'other').default('broiler'),
  supplierId: Joi.number().optional(),
  arrivalDate: Joi.date().iso().required(),
  quantityReceived: Joi.number().integer().positive().required(),
  costPerChick: Joi.number().precision(2).positive().required(),
});

const updateBatchSchema = Joi.object({
  batchCode: Joi.string().optional().max(30),
  breed: Joi.string().optional().max(100),
  batchType: Joi.string().valid('broiler', 'layer', 'breeder', 'other').optional(),
  supplierId: Joi.number().optional().allow(null),
  arrivalDate: Joi.date().iso().optional(),
  quantityReceived: Joi.number().integer().positive().optional(),
  costPerChick: Joi.number().precision(2).positive().optional(),
  status: Joi.string().valid('active', 'closed', 'archived').optional(),
});

const updateBatchStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'closed', 'archived').required(),
});

const batchStatsSchema = Joi.object({
  farmId: Joi.number().required(),
});

module.exports = {
  createBatchSchema,
  updateBatchSchema,
  updateBatchStatusSchema,
  batchStatsSchema,
};