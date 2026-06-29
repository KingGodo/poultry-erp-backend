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

router.use(authenticate);

router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_batches']),
  batchController.listBatches
);

router.get(
  '/stats/:farmId',
  authorize('system_admin', 'owner', 'manager', ['view_batches']),
  batchController.getBatchStats
);

router.post(
  '/',
  authorize('system_admin', 'owner', ['create_batch']),
  validate(createBatchSchema),
  batchController.createBatch
);

router.get(
  '/:id',
  checkFarmAccess(),
  authorize('system_admin', 'owner', 'manager', ['view_batches']),
  batchController.getBatch
);

router.put(
  '/:id',
  checkFarmAccess(),
  authorize('system_admin', 'owner', ['update_batch']),
  validate(updateBatchSchema),
  batchController.updateBatch
);

router.delete(
  '/:id',
  authorize(['delete_batch']),
  batchController.deleteBatch
);

router.patch(
  '/:id/status',
  checkFarmAccess(),
  authorize('system_admin', 'owner', ['change_batch_status']),
  validate(updateBatchStatusSchema),
  batchController.updateBatchStatus
);

module.exports = router;