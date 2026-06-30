// src/modules/mortality-vaccination/vaccinations/vaccinations.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./vaccinations.controller');
const { validate } = require('../../../middleware/validate.middleware');
const { authenticate } = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/role.middleware');
const {
  createVaccinationSchema,
  updateVaccinationSchema,
} = require('./vaccinations.validation');

router.use(authenticate);

router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_vaccinations']),
  controller.listVaccinations
);

router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_vaccinations']),
  controller.getVaccination
);

router.post(
  '/',
  authorize('system_admin', 'owner', ['create_vaccination']),
  validate(createVaccinationSchema),
  controller.createVaccination
);

router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_vaccination']),
  validate(updateVaccinationSchema),
  controller.updateVaccination
);

router.delete(
  '/:id',
  authorize(['delete_vaccination']),
  controller.deleteVaccination
);

module.exports = router;