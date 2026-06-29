// src/modules/farms/farms.validation.js
const Joi = require('joi');

const createFarmSchema = Joi.object({
  name: Joi.string().required().max(150),
  location: Joi.string().optional().max(255),
  contactPhone: Joi.string().optional().pattern(/^[0-9+\-\s()]{10,30}$/),
  currency: Joi.string().default('USD').length(3),
  timezone: Joi.string().default('UTC'),
  ownerId: Joi.number().optional(),
});

const updateFarmSchema = Joi.object({
  name: Joi.string().optional().max(150),
  location: Joi.string().optional().max(255),
  contactPhone: Joi.string().optional().pattern(/^[0-9+\-\s()]{10,30}$/),
  isActive: Joi.boolean().optional(),
  currency: Joi.string().optional().length(3),
  timezone: Joi.string().optional(),
  ownerId: Joi.number().optional(),
});

const updateSettingsSchema = Joi.object({
  name: Joi.string().optional().max(150),
  location: Joi.string().optional().max(255),
  contactPhone: Joi.string().optional().pattern(/^[0-9+\-\s()]{10,30}$/),
  currency: Joi.string().optional().length(3),
  timezone: Joi.string().optional(),
});

module.exports = {
  createFarmSchema,
  updateFarmSchema,
  updateSettingsSchema,
};