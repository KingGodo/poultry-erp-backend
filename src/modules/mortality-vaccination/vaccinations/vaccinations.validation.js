// src/modules/mortality-vaccination/vaccinations/vaccinations.validation.js
const Joi = require('joi');

const createVaccinationSchema = Joi.object({
  farmId: Joi.number().integer().required(),
  scheduleId: Joi.number().integer().required(),
  runId: Joi.number().integer().optional().allow(null),
  administeredDate: Joi.date().iso().optional(),
  dosage: Joi.string().optional().max(50),
  notes: Joi.string().optional(),
});

const updateVaccinationSchema = Joi.object({
  runId: Joi.number().integer().optional().allow(null),
  administeredDate: Joi.date().iso().optional(),
  dosage: Joi.string().optional().max(50),
  notes: Joi.string().optional(),
});

module.exports = {
  createVaccinationSchema,
  updateVaccinationSchema,
};