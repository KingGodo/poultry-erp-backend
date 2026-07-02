// src/modules/expenses/expenses.validation.js
const Joi = require('joi');

const createExpenseSchema = Joi.object({
  farmId: Joi.number().integer().required(),
  categoryId: Joi.number().integer().required(),
  batchId: Joi.number().integer().optional().allow(null),
  description: Joi.string().optional().max(255),
  amount: Joi.number().positive().required(),
  expenseDate: Joi.date().iso().optional(),
});

const updateExpenseSchema = Joi.object({
  categoryId: Joi.number().integer().optional(),
  batchId: Joi.number().integer().optional().allow(null),
  description: Joi.string().optional().max(255),
  amount: Joi.number().positive().optional(),
  expenseDate: Joi.date().iso().optional(),
});

module.exports = {
  createExpenseSchema,
  updateExpenseSchema,
};