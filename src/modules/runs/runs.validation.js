// src/modules/runs/runs.validation.js
const Joi = require('joi');

const createRunSchema = Joi.object({
  houseId: Joi.number().required(),
  name: Joi.string().required().max(100),
  capacity: Joi.number().required().min(0),
  currentBirds: Joi.number().default(0).min(0),
  runType: Joi.string().valid('broiler', 'layer', 'breeder', 'other').default('broiler'),
  status: Joi.string().valid('empty', 'occupied', 'cleaning', 'maintenance').default('empty'),
  createdBy: Joi.number().optional(),
});

const updateRunSchema = Joi.object({
  name: Joi.string().optional().max(100),
  capacity: Joi.number().optional().min(0),
  currentBirds: Joi.number().optional().min(0),
  runType: Joi.string().valid('broiler', 'layer', 'breeder', 'other').optional(),
  status: Joi.string().valid('empty', 'occupied', 'cleaning', 'maintenance').optional(),
  houseId: Joi.number().optional(),
});

const updateRunStatusSchema = Joi.object({
  status: Joi.string().valid('empty', 'occupied', 'cleaning', 'maintenance').required(),
});

module.exports = {
  createRunSchema,
  updateRunSchema,
  updateRunStatusSchema,
};