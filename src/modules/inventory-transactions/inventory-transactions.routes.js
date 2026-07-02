// src/modules/inventory-transactions/inventory-transactions.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./inventory-transactions.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { createTransactionSchema } = require('./inventory-transactions.validation');

router.use(authenticate);

router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_inventory_transactions']),
  controller.listTransactions
);

router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_inventory_transactions']),
  controller.getTransaction
);

router.post(
  '/',
  authorize('system_admin', 'owner', ['create_inventory_transaction']),
  validate(createTransactionSchema),
  controller.createTransaction
);

router.delete(
  '/:id',
  authorize(['delete_inventory_transaction']),
  controller.deleteTransaction
);

module.exports = router;