// src/modules/mortality-vaccination/mortality-records/mortality-records.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./mortality-records.controller');
const { validate } = require('../../../middleware/validate.middleware');
const { authenticate } = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/role.middleware');
const Joi = require('joi');

// Validation schemas – these must be defined before use!
const createSchema = Joi.object({
  farmId: Joi.number().integer().required(),
  runId: Joi.number().integer().required(),
  batchId: Joi.number().integer().required(),
  quantityDead: Joi.number().integer().positive().required(),
  reasonCodeId: Joi.number().integer().optional(),
  notes: Joi.string().optional(),
  recordedDate: Joi.date().iso().optional(),
});

const updateSchema = Joi.object({
  reasonCodeId: Joi.number().integer().optional(),
  notes: Joi.string().optional(),
  recordedDate: Joi.date().iso().optional(),
});

// All routes require authentication
router.use(authenticate);

// List mortality records (with filters via query)
router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_mortality_records']),
  controller.listRecords
);

// Get a single record by ID
router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_mortality_records']),
  controller.getRecord
);

// Create a new record
router.post(
  '/',
  authorize('system_admin', 'owner', ['create_mortality_record']),
  validate(createSchema),
  controller.createRecord
);

// Update a record (only notes & reasonCodeId)
router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_mortality_record']),
  validate(updateSchema),
  controller.updateRecord
);

// Delete a record (only system_admin)
router.delete(
  '/:id',
  authorize(['delete_mortality_record']),
  controller.deleteRecord
);

module.exports = router;