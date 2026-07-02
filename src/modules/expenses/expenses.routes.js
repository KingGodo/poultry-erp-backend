// src/modules/expenses/expenses.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./expenses.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { createExpenseSchema, updateExpenseSchema } = require('./expenses.validation');

router.use(authenticate);

router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_expenses']),
  controller.listExpenses
);

router.get(
  '/stats/:farmId',
  authorize('system_admin', 'owner', ['view_expense_stats']),
  controller.getExpenseStats
);

router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_expenses']),
  controller.getExpense
);

router.post(
  '/',
  authorize('system_admin', 'owner', ['create_expense']),
  validate(createExpenseSchema),
  controller.createExpense
);

router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_expense']),
  validate(updateExpenseSchema),
  controller.updateExpense
);

router.delete(
  '/:id',
  authorize(['delete_expense']),
  controller.deleteExpense
);

module.exports = router;