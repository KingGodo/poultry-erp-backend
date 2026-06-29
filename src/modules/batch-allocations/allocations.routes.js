// src/modules/batch-allocations/allocations.routes.js
const express = require('express');
const router = express.Router();
const allocationController = require('./allocations.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { createAllocationSchema, updateAllocationSchema } = require('./allocations.validation');

router.use(authenticate);

router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_allocations']),
  allocationController.listAllocations
);

router.post(
  '/',
  authorize('system_admin', 'owner', ['create_allocation']),
  validate(createAllocationSchema),
  allocationController.createAllocation
);

router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_allocations']),
  allocationController.getAllocation
);

router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_allocation']),
  validate(updateAllocationSchema),
  allocationController.updateAllocation
);

router.delete(
  '/:id',
  authorize('system_admin', 'owner', ['delete_allocation']),
  allocationController.deleteAllocation
);

module.exports = router;