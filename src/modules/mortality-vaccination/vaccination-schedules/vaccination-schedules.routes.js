// src/modules/mortality-vaccination/vaccination-schedules/vaccination-schedules.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./vaccination-schedules.controller');
const { validate } = require('../../../middleware/validate.middleware');
const { authenticate } = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/role.middleware');
const {
  createScheduleSchema,
  updateScheduleSchema,
  updateScheduleStatusSchema,
} = require('./vaccination-schedules.validation');

router.use(authenticate);

// List schedules
router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_vaccination_schedules']),
  controller.listSchedules
);

// Get single schedule
router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_vaccination_schedules']),
  controller.getSchedule
);

// Create schedule
router.post(
  '/',
  authorize('system_admin', 'owner', ['create_vaccination_schedule']),
  validate(createScheduleSchema),
  controller.createSchedule
);

// Update schedule
router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_vaccination_schedule']),
  validate(updateScheduleSchema),
  controller.updateSchedule
);

// Delete schedule
router.delete(
  '/:id',
  authorize(['delete_vaccination_schedule']),
  controller.deleteSchedule
);

// Update schedule status
router.patch(
  '/:id/status',
  authorize('system_admin', 'owner', ['update_schedule_status']),
  validate(updateScheduleStatusSchema),
  controller.updateScheduleStatus
);

module.exports = router;