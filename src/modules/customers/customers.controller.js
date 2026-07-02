// src/modules/customers/customers.controller.js
const customerService = require('./customers.service');
const ApiResponse = require('../../utils/ApiResponse');

class CustomerController {
  async listCustomers(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, search, farmId } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
        search,
        farmId: farmId ? parseInt(farmId) : undefined,
      };
      const result = await customerService.listCustomers(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Customers retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const customer = await customerService.getCustomerById(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, customer, 'Customer retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createCustomer(req, res, next) {
    try {
      const customer = await customerService.createCustomer(req.body, req.user);
      res.status(201).json(new ApiResponse(201, customer, 'Customer created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const customer = await customerService.updateCustomer(parseInt(id), req.body, req.user);
      res.status(200).json(new ApiResponse(200, customer, 'Customer updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteCustomer(req, res, next) {
    try {
      const { id } = req.params;
      await customerService.deleteCustomer(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, null, 'Customer deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();