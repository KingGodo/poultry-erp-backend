// src/modules/mortality-vaccination/vaccines/vaccines.validation.js
const Joi = require('joi');

const createVaccineSchema = Joi.object({
  farmId: Joi.number().integer().required(),
  name: Joi.string().required().max(100),
});

const updateVaccineSchema = Joi.object({
  name: Joi.string().optional().max(100),
});

module.exports = {
  createVaccineSchema,
  updateVaccineSchema,
};