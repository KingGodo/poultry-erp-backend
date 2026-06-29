// src/modules/runs/runs.routes.js
const express = require('express');
const router = express.Router();
const runController = require('./runs.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { checkFarmAccess } = require('../../middleware/farmAccess.middleware');
const Joi = require('joi');

const createRunSchema = Joi.object({
  houseId: Joi.number().required(),
  name: Joi.string().required().max(100),
  capacity: Joi.number().integer().positive().required(),
  runType: Joi.string().valid('broiler', 'layer', 'breeder', 'other').default('broiler'),
  status: Joi.string().valid('empty', 'occupied', 'cleaning', 'maintenance').default('empty'),
});

const updateRunSchema = Joi.object({
  name: Joi.string().optional().max(100),
  capacity: Joi.number().integer().positive().optional(),
  runType: Joi.string().valid('broiler', 'layer', 'breeder', 'other').optional(),
  status: Joi.string().valid('empty', 'occupied', 'cleaning', 'maintenance').optional(),
  currentBirds: Joi.number().integer().min(0).optional(),
});

const updateRunStatusSchema = Joi.object({
  status: Joi.string().valid('empty', 'occupied', 'cleaning', 'maintenance').required(),
});

router.use(authenticate);

// List runs
router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_runs']),
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
  checkFarmAccess(),
  authorize('system_admin', 'owner', 'manager', ['view_runs']),
  runController.getRun
);

// Update run
router.put(
  '/:id',
  checkFarmAccess(),
  authorize('system_admin', 'owner', ['update_run']),
  validate(updateRunSchema),
  runController.updateRun
);

// Delete run (soft delete / set status to empty)
router.delete(
  '/:id',
  authorize(['delete_run']),
  runController.deleteRun
);

// Update run status
router.patch(
  '/:id/status',
  checkFarmAccess(),
  authorize('system_admin', 'owner', 'manager', ['update_run_status']),
  validate(updateRunStatusSchema),
  runController.updateRunStatus
);

module.exports = router;