// src/modules/inventory-items/inventory-items.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./inventory-items.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { createItemSchema, updateItemSchema } = require('./inventory-items.validation');

router.use(authenticate);

router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_inventory_items']),
  controller.listItems
);

router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_inventory_items']),
  controller.getItem
);

router.post(
  '/',
  authorize('system_admin', 'owner', ['create_inventory_item']),
  validate(createItemSchema),
  controller.createItem
);

router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_inventory_item']),
  validate(updateItemSchema),
  controller.updateItem
);

router.delete(
  '/:id',
  authorize(['delete_inventory_item']),
  controller.deleteItem
);

module.exports = router;