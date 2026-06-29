// src/modules/runs/runs.routes.js
const express = require('express');
const router = express.Router();
const runController = require('./runs.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const {
  createRunSchema,
  updateRunSchema,
  updateRunStatusSchema,
} = require('./runs.validation');

// All run routes require authentication
router.use(authenticate);

// List runs
router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', 'staff', ['view_runs']),
  runController.listRuns
);

// Create run
router.post(
  '/',
  authorize('system_admin', 'owner', ['create_run']),
  validate(createRunSchema),
  runController.createRun
);

// Get run by ID
router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', 'staff', ['view_runs']),
  runController.getRun
);

// Update run
router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_run']),
  validate(updateRunSchema),
  runController.updateRun
);

// Delete run
router.delete(
  '/:id',
  authorize(['delete_run']),
  runController.deleteRun
);

// Update run status
router.patch(
  '/:id/status',
  authorize('system_admin', 'owner', 'manager', ['update_run_status']),
  validate(updateRunStatusSchema),
  runController.updateRunStatus
);

module.exports = router;