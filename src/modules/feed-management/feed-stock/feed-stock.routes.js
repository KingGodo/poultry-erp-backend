const express = require('express');
const router = express.Router();
const feedStockController = require('./feed-stock.controller');
const { authenticate } = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/role.middleware');
const Joi = require('joi');
const { validate } = require('../../../middleware/validate.middleware');

const reorderLevelSchema = Joi.object({
  reorderLevel: Joi.number().min(0).required(),
});

router.use(authenticate);

router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_feed_stock']),
  feedStockController.listStock
);

router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_feed_stock']),
  feedStockController.getStock
);

router.patch(
  '/:id/reorder-level',
  authorize('system_admin', 'owner', ['view_feed_stock']),
  validate(reorderLevelSchema),
  feedStockController.updateReorderLevel
);

module.exports = router;