// src/modules/batches/batches.routes.js
const express = require('express');
const router = express.Router();
const batchController = require('./batches.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { checkFarmAccess } = require('../../middleware/farmAccess.middleware');
const {
  createBatchSchema,
  updateBatchSchema,
  updateBatchStatusSchema,
} = require('./batches.validation');

// All batch routes require authentication
router.use(authenticate);

// List batches – system_admin, owner, manager, staff (with view_batches permission)
router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_batches']),
  batchController.listBatches
);

// Get batch statistics for a farm
router.get(
  '/stats/:farmId',
  authorize('system_admin', 'owner', 'manager', ['view_batches']),
  batchController.getBatchStats
);

// Create batch – system_admin, owner, manager (with create_batch permission)
router.post(
  '/',
  authorize('system_admin', 'owner', ['create_batch']),
  validate(createBatchSchema),
  batchController.createBatch
);

// Get batch by ID – with farm access check
router.get(
  '/:id',
  checkFarmAccess(),
  authorize('system_admin', 'owner', 'manager', ['view_batches']),
  batchController.getBatch
);

// Update batch – system_admin, owner, manager (with update_batch permission)
router.put(
  '/:id',
  checkFarmAccess(),
  authorize('system_admin', 'owner', ['update_batch']),
  validate(updateBatchSchema),
  batchController.updateBatch
);

// Delete batch – system_admin only
router.delete(
  '/:id',
  authorize(['delete_batch']),
  batchController.deleteBatch
);

// Update batch status – system_admin, owner (with change_batch_status permission)
router.patch(
  '/:id/status',
  checkFarmAccess(),
  authorize('system_admin', 'owner', ['change_batch_status']),
  validate(updateBatchStatusSchema),
  batchController.updateBatchStatus
);

module.exports = router;