// src/modules/houses/houses.validation.js
const Joi = require('joi');

const createHouseSchema = Joi.object({
  farmId: Joi.number().required(),
  name: Joi.string().required().max(100),
  description: Joi.string().optional().allow(''),
  isActive: Joi.boolean().default(true),
  createdBy: Joi.number().optional(),
});

const updateHouseSchema = Joi.object({
  name: Joi.string().optional().max(100),
  description: Joi.string().optional().allow(''),
  isActive: Joi.boolean().optional(),
  farmId: Joi.number().optional(),
});

module.exports = {
  createHouseSchema,
  updateHouseSchema,
};