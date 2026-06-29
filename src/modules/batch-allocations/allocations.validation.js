// src/modules/batch-allocations/allocations.validation.js
const Joi = require('joi');

const createAllocationSchema = Joi.object({
  batchId: Joi.number().required(),
  runId: Joi.number().required(),
  quantity: Joi.number().integer().positive().required(),
});

const updateAllocationSchema = Joi.object({
  quantity: Joi.number().integer().positive().required(),
});

module.exports = {
  createAllocationSchema,
  updateAllocationSchema,
};