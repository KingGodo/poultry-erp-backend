const express = require('express');
const router = express.Router();
const controller = require('./mortality-reasons.controller');
const { validate } = require('../../../middleware/validate.middleware');
const { authenticate } = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/role.middleware');
const Joi = require('joi');

const createSchema = Joi.object({
  farmId: Joi.number().required(),
  code: Joi.string().required().max(30),
  description: Joi.string().optional(),
});

const updateSchema = Joi.object({
  code: Joi.string().optional().max(30),
  description: Joi.string().optional(),
});

router.use(authenticate);

router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_mortality_reasons']),
  controller.listReasons
);

router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_mortality_reasons']),
  controller.getReason
);

router.post(
  '/',
  authorize('system_admin', 'owner', ['create_mortality_reason']),
  validate(createSchema),
  controller.createReason
);

router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_mortality_reason']),
  validate(updateSchema),
  controller.updateReason
);

router.delete(
  '/:id',
  authorize(['delete_mortality_reason']),
  controller.deleteReason
);

module.exports = router;