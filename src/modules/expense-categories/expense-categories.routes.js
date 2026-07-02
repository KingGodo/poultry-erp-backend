// src/modules/expense-categories/expense-categories.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./expense-categories.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { createCategorySchema, updateCategorySchema } = require('./expense-categories.validation');

router.use(authenticate);

router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_expense_categories']),
  controller.listCategories
);

router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_expense_categories']),
  controller.getCategory
);

router.post(
  '/',
  authorize('system_admin', 'owner', ['create_expense_category']),
  validate(createCategorySchema),
  controller.createCategory
);

router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_expense_category']),
  validate(updateCategorySchema),
  controller.updateCategory
);

router.delete(
  '/:id',
  authorize(['delete_expense_category']),
  controller.deleteCategory
);

module.exports = router;