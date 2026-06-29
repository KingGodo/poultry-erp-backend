// src/modules/houses/houses.routes.js
const express = require('express');
const router = express.Router();
const houseController = require('./houses.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { checkFarmAccess } = require('../../middleware/farmAccess.middleware');
const {
  createHouseSchema,
  updateHouseSchema,
} = require('./houses.validation');

// All house routes require authentication
router.use(authenticate);

// List houses
router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', 'staff', ['view_houses']),
  houseController.listHouses
);

// Create house
router.post(
  '/',
  authorize('system_admin', 'owner', ['create_house']),
  validate(createHouseSchema),
  houseController.createHouse
);

// Get house by ID
router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', 'staff', ['view_houses']),
  houseController.getHouse
);

// Update house
router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_house']),
  validate(updateHouseSchema),
  houseController.updateHouse
);

// Delete house
router.delete(
  '/:id',
  authorize(['delete_house']),
  houseController.deleteHouse
);

// Get runs under house
router.get(
  '/:id/runs',
  authorize('system_admin', 'owner', 'manager', 'staff', ['view_runs']),
  houseController.getRunsByHouse
);

module.exports = router;