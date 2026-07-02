// src/modules/expense-categories/expense-categories.validation.js
const Joi = require('joi');

const createCategorySchema = Joi.object({
  farmId: Joi.number().integer().required(),
  name: Joi.string().required().max(50),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().optional().max(50),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};