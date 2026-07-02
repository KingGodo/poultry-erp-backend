// src/modules/dashboard/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

router.use(authenticate);

// Get full dashboard
router.get(
  '/:farmId',
  authorize('system_admin', 'owner', 'manager', ['view_dashboard']),
  dashboardController.getDashboard
);

// Get quick stats (lightweight)
router.get(
  '/:farmId/quick',
  authorize('system_admin', 'owner', 'manager', ['view_dashboard']),
  dashboardController.getQuickStats
);

module.exports = router;