// src/modules/inventory-items/inventory-items.validation.js
const Joi = require('joi');

const createItemSchema = Joi.object({
  farmId: Joi.number().integer().required(),
  name: Joi.string().required().max(150),
  category: Joi.string().valid('vaccine', 'medicine', 'equipment', 'other').required(),
  unit: Joi.string().default('unit'),
  quantity: Joi.number().min(0).default(0),
  reorderLevel: Joi.number().min(0).default(0),
});

const updateItemSchema = Joi.object({
  name: Joi.string().optional().max(150),
  category: Joi.string().valid('vaccine', 'medicine', 'equipment', 'other').optional(),
  unit: Joi.string().optional(),
  reorderLevel: Joi.number().min(0).optional(),
});

module.exports = {
  createItemSchema,
  updateItemSchema,
};