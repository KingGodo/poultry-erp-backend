// src/modules/sales/sales.validation.js
const Joi = require('joi');

const createSaleSchema = Joi.object({
  farmId: Joi.number().integer().required(),
  productType: Joi.string().valid('bird', 'egg').required(),
  unit: Joi.string().default('bird'),
  batchId: Joi.number().integer().when('productType', {
    is: 'bird',
    then: Joi.required(),
    otherwise: Joi.optional().allow(null),
  }),
  runId: Joi.number().integer().when('productType', {
    is: 'bird',
    then: Joi.required(),
    otherwise: Joi.optional().allow(null),
  }),
  customerId: Joi.number().integer().optional().allow(null),
  quantitySold: Joi.number().positive().required(),
  totalWeightKg: Joi.number().positive().when('priceBasis', {
    is: 'per_kg',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  priceBasis: Joi.string().valid('per_unit', 'per_kg').default('per_unit'),
  unitPrice: Joi.number().positive().required(),
  saleDate: Joi.date().iso().optional(),
});

const updateSaleSchema = Joi.object({
  customerId: Joi.number().integer().optional().allow(null),
  saleDate: Joi.date().iso().optional(),
});

module.exports = {
  createSaleSchema,
  updateSaleSchema,
};