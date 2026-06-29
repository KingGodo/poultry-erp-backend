// src/modules/users/users.routes.js
const express = require('express');
const router = express.Router();
const userController = require('./users.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { checkFarmAccess } = require('../../middleware/farmAccess.middleware');
const {
  createUserSchema,
  updateUserSchema,
  changeRoleSchema,
  changeStatusSchema,
  farmAccessSchema,
  removeFarmAccessSchema,
} = require('./users.validation');

// All user routes require authentication
router.use(authenticate);

// Global admin routes (system_admin only for delete/role changes)
router.get(
  '/',
  authorize('view_users'), // permission to view users (we'll add this permission)
  userController.listUsers
);

router.get(
  '/roles',
  userController.getAllRoles
);

router.get(
  '/farms',
  userController.getAllFarms
);

router.get(
  '/:id',
  userController.getUser
);

router.post(
  '/',
  validate(createUserSchema),
  userController.createUser
);

router.put(
  '/:id',
  validate(updateUserSchema),
  userController.updateUser
);

router.delete(
  '/:id',
  authorize('delete_user'), // system_admin only
  userController.deleteUser
);

// Role and status changes (system_admin only for role change)
router.patch(
  '/:id/role',
  authorize('change_role'), // system_admin only
  validate(changeRoleSchema),
  userController.changeRole
);

router.patch(
  '/:id/status',
  authorize('change_status'),
  validate(changeStatusSchema),
  userController.changeStatus
);

// Farm access management (owners/managers can manage access to their farms)
router.get(
  '/:id/farms',
  userController.getUserFarms
);

router.post(
  '/:id/farms',
  validate(farmAccessSchema),
  userController.addFarmAccess
);

router.delete(
  '/:id/farms',
  validate(removeFarmAccessSchema),
  userController.removeFarmAccess
);

module.exports = router;