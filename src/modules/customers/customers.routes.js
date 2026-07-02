// src/modules/customers/customers.routes.js
const express = require('express');
const router = express.Router();
const customerController = require('./customers.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { createCustomerSchema, updateCustomerSchema } = require('./customers.validation');

router.use(authenticate);

// List customers (with pagination, search, farm filter)
router.get(
  '/',
  authorize('system_admin', 'owner', 'manager', ['view_customers']),
  customerController.listCustomers
);

// Get a single customer by ID
router.get(
  '/:id',
  authorize('system_admin', 'owner', 'manager', ['view_customers']),
  customerController.getCustomer
);

// Create a new customer
router.post(
  '/',
  authorize('system_admin', 'owner', ['create_customer']),
  validate(createCustomerSchema),
  customerController.createCustomer
);

// Update a customer
router.put(
  '/:id',
  authorize('system_admin', 'owner', ['update_customer']),
  validate(updateCustomerSchema),
  customerController.updateCustomer
);

// Delete a customer (only system_admin)
router.delete(
  '/:id',
  authorize(['delete_customer']),
  customerController.deleteCustomer
);

module.exports = router;