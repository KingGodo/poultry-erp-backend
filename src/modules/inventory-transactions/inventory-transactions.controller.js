// src/modules/inventory-transactions/inventory-transactions.controller.js
const transactionService = require('./inventory-transactions.service');
const ApiResponse = require('../../utils/ApiResponse');

class InventoryTransactionController {
  async listTransactions(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, itemId, farmId, transactionType, fromDate, toDate } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'transactionDate',
        sortOrder: sortOrder || 'desc',
        itemId: itemId ? parseInt(itemId) : undefined,
        farmId: farmId ? parseInt(farmId) : undefined,
        transactionType,
        fromDate,
        toDate,
      };
      const result = await transactionService.listTransactions(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Inventory transactions retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getTransaction(req, res, next) {
    try {
      const { id } = req.params;
      const transaction = await transactionService.getTransactionById(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, transaction, 'Inventory transaction retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createTransaction(req, res, next) {
    try {
      const transaction = await transactionService.createTransaction(req.body, req.user);
      res.status(201).json(new ApiResponse(201, transaction, 'Inventory transaction created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteTransaction(req, res, next) {
    try {
      const { id } = req.params;
      await transactionService.deleteTransaction(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, null, 'Inventory transaction deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryTransactionController();