const express = require('express');
const router = express.Router();
const feedTypeController = require('./feed-types.controller');
const { validate } = require('../../../middleware/validate.middleware');
const { authenticate } = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/role.middleware');
const Joi = require('joi');

const createFeedTypeSchema = Joi.object({
  farmId: Joi.number().required(),
  name: Joi.string().required().max(50),
  category: Joi.string().optional().max(30),
});

const updateFeedTypeSchema = Joi.object({
  name: Joi.string().optional().max(50),
  category: Joi.string().optional().max(30),
});

router.use(authenticate);

router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_feed_types']),
  feedTypeController.listFeedTypes
);

router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_feed_types']),
  feedTypeController.getFeedType
);

router.post(
  '/',
  authorize('system_admin', 'owner', ['create_feed_type']),
  validate(createFeedTypeSchema),
  feedTypeController.createFeedType
);

router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_feed_type']),
  validate(updateFeedTypeSchema),
  feedTypeController.updateFeedType
);

router.delete(
  '/:id',
  authorize(['delete_feed_type']),
  feedTypeController.deleteFeedType
);

module.exports = router;