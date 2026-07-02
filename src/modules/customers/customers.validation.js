// src/modules/customers/customers.validation.js
const Joi = require('joi');

const createCustomerSchema = Joi.object({
  farmId: Joi.number().integer().required(),
  name: Joi.string().required().max(150),
  contactPhone: Joi.string().optional().allow(null).max(30),
  contactEmail: Joi.string().email().optional().allow(null).max(150),
  address: Joi.string().optional().allow(null).max(255),
});

const updateCustomerSchema = Joi.object({
  name: Joi.string().optional().max(150),
  contactPhone: Joi.string().optional().allow(null).max(30),
  contactEmail: Joi.string().email().optional().allow(null).max(150),
  address: Joi.string().optional().allow(null).max(255),
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
};