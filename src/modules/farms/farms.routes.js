// src/modules/farms/farms.routes.js
const express = require('express');
const router = express.Router();
const farmController = require('./farms.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { checkFarmAccess } = require('../../middleware/farmAccess.middleware');
const {
  createFarmSchema,
  updateFarmSchema,
  updateSettingsSchema,
} = require('./farms.validation');

// All farm routes require authentication
router.use(authenticate);

// List farms – system_admin, owner, manager
router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_farms']),
  farmController.listFarms
);

// Create farm – system_admin or owner (with create_farm permission)
router.post(
  '/',
  authorize('system_admin', 'owner', ['create_farm']),
  validate(createFarmSchema),
  farmController.createFarm
);

// Get farm by ID – check farm access
router.get(
  '/:id',
  checkFarmAccess(),
  authorize('system_admin', 'owner', 'manager', ['view_farms']),
  farmController.getFarm
);

// Update farm – owner or system_admin
router.put(
  '/:id',
  checkFarmAccess(),
  authorize('system_admin', 'owner', ['update_farm']),
  validate(updateFarmSchema),
  farmController.updateFarm
);

// Delete farm – system_admin only
router.delete(
  '/:id',
  authorize(['delete_farm']),
  farmController.deleteFarm
);

// Get farm users – system_admin, owner, manager
router.get(
  '/:id/users',
  checkFarmAccess(),
  authorize('system_admin', 'owner', 'manager', ['view_farm_users']),
  farmController.getFarmUsers
);

// Update farm settings – system_admin or owner
router.patch(
  '/:id/settings',
  checkFarmAccess(),
  authorize('system_admin', 'owner', ['manage_farm_settings']),
  validate(updateSettingsSchema),
  farmController.updateFarmSettings
);

module.exports = router;