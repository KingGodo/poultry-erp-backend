const express = require('express');
const router = express.Router();
const feedDistributionController = require('./feed-distributions.controller');
const { validate } = require('../../../middleware/validate.middleware');
const { authenticate } = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/role.middleware');
const Joi = require('joi');

const createDistributionSchema = Joi.object({
  farmId: Joi.number().required(),
  runId: Joi.number().required(),
  feedTypeId: Joi.number().required(),
  quantityBags: Joi.number().positive().required(),
  distributedDate: Joi.date().iso().default(() => new Date().toISOString().split('T')[0]),
});

const updateDistributionSchema = Joi.object({
  // We avoid quantity updates; allow only date changes
  distributedDate: Joi.date().iso().optional(),
});

router.use(authenticate);

router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_feed_distributions']),
  feedDistributionController.listDistributions
);

router.get(
  '/run/:runId',
  authorize('system_admin', 'owner', 'manager', ['view_feed_distributions']),
  feedDistributionController.getDistributionsByRun
);

router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_feed_distributions']),
  feedDistributionController.getDistribution
);

router.post(
  '/',
  authorize('system_admin', 'owner', ['create_feed_distribution']),
  validate(createDistributionSchema),
  feedDistributionController.createDistribution
);

router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_feed_distribution']),
  validate(updateDistributionSchema),
  feedDistributionController.updateDistribution
);

router.delete(
  '/:id',
  authorize(['delete_feed_distribution']),
  feedDistributionController.deleteDistribution
);

module.exports = router;