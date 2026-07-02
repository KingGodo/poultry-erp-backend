// src/modules/sales/sales.routes.js
const express = require('express');
const router = express.Router();
const salesController = require('./sales.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { createSaleSchema, updateSaleSchema } = require('./sales.validation');

router.use(authenticate);

// List sales (with filters, pagination)
router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_sales']),
  salesController.listSales
);

// Get sales statistics
router.get(
  '/stats/:farmId',
  authorize('system_admin', 'owner', ['view_sales_stats']),
  salesController.getSalesStats
);

// Get a single sale
router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_sales']),
  salesController.getSale
);

// Create a sale
router.post(
  '/',
  authorize('system_admin', 'owner', ['create_sale']),
  validate(createSaleSchema),
  salesController.createSale
);

// Update a sale (only customer/date)
router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_sale']),
  validate(updateSaleSchema),
  salesController.updateSale
);

// Delete a sale (soft delete)
router.delete(
  '/:id',
  authorize(['delete_sale']),
  salesController.deleteSale
);

module.exports = router;