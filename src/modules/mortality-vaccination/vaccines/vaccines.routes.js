// src/modules/mortality-vaccination/vaccines/vaccines.routes.js
const express = require('express');
const router = express.Router();
const vaccineController = require('./vaccines.controller');
const { validate } = require('../../../middleware/validate.middleware');
const { authenticate } = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/role.middleware');

// ✅ Import schemas from validation file (only once)
const { createVaccineSchema, updateVaccineSchema } = require('./vaccines.validation');

// All routes require authentication
router.use(authenticate);

// List vaccines
router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_vaccines']),
  vaccineController.listVaccines
);

// Get a single vaccine
router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_vaccines']),
  vaccineController.getVaccine
);

// Create vaccine
router.post(
  '/',
  authorize('system_admin', 'owner', ['create_vaccine']),
  validate(createVaccineSchema),
  vaccineController.createVaccine
);

// Update vaccine
router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_vaccine']),
  validate(updateVaccineSchema),
  vaccineController.updateVaccine
);

// Delete vaccine
router.delete(
  '/:id',
  authorize(['delete_vaccine']),
  vaccineController.deleteVaccine
);

module.exports = router;