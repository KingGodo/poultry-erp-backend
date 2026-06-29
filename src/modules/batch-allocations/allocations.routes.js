// src/modules/batch-allocations/allocations.routes.js
const express = require('express');
const router = express.Router();
const allocationController = require('./allocations.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { createAllocationSchema, updateAllocationSchema } = require('./allocations.validation');

// All allocation routes require authentication
router.use(authenticate);

// List allocations – system_admin, owner, manager, staff (view_allocations)
router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_allocations']),
  allocationController.listAllocations
);

// Create allocation – system_admin, owner, manager (create_allocation)
router.post(
  '/',
  authorize('system_admin', 'owner', ['create_allocation']),
  validate(createAllocationSchema),
  allocationController.createAllocation
);

// Get allocation by ID
router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_allocations']),
  allocationController.getAllocation
);

// Update allocation – system_admin, owner, manager (update_allocation)
router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_allocation']),
  validate(updateAllocationSchema),
  allocationController.updateAllocation
);

// Delete allocation – system_admin, owner (delete_allocation)
router.delete(
  '/:id',
  authorize('system_admin', 'owner', ['delete_allocation']),
  allocationController.deleteAllocation
);

module.exports = router;