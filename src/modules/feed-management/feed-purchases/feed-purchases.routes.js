const express = require('express');
const router = express.Router();
const feedPurchaseController = require('./feed-purchases.controller');
const { validate } = require('../../../middleware/validate.middleware');
const { authenticate } = require('../../../middleware/auth.middleware');
const { authorize } = require('../../../middleware/role.middleware');
const Joi = require('joi');

const createPurchaseSchema = Joi.object({
  farmId: Joi.number().required(),
  feedTypeId: Joi.number().required(),
  supplierId: Joi.number().optional(),
  quantityBags: Joi.number().positive().required(),
  weightPerBagKg: Joi.number().positive().default(50),
  costPerBag: Joi.number().positive().required(),
  purchaseDate: Joi.date().iso().default(() => new Date().toISOString().split('T')[0]),
});

const updatePurchaseSchema = Joi.object({
  feedTypeId: Joi.number().optional(),
  supplierId: Joi.number().optional(),
  weightPerBagKg: Joi.number().positive().optional(),
  costPerBag: Joi.number().positive().optional(),
  purchaseDate: Joi.date().iso().optional(),
  // quantity is not updatable to avoid stock complexity
});

router.use(authenticate);

router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_feed_purchases']),
  feedPurchaseController.listPurchases
);

router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_feed_purchases']),
  feedPurchaseController.getPurchase
);

router.post(
  '/',
  authorize('system_admin', 'owner', ['create_feed_purchase']),
  validate(createPurchaseSchema),
  feedPurchaseController.createPurchase
);

router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_feed_purchase']),
  validate(updatePurchaseSchema),
  feedPurchaseController.updatePurchase
);

router.delete(
  '/:id',
  authorize(['delete_feed_purchase']),
  feedPurchaseController.deletePurchase
);

module.exports = router;