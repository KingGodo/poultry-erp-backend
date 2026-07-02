// src/modules/inventory-transactions/inventory-transactions.validation.js
const Joi = require('joi');

const createTransactionSchema = Joi.object({
  inventoryItemId: Joi.number().integer().required(),
  transactionType: Joi.string().valid('in', 'out').required(),
  quantity: Joi.number().positive().required(),
  reference: Joi.string().optional().max(150),
  transactionDate: Joi.date().iso().optional(),
});

module.exports = {
  createTransactionSchema,
};