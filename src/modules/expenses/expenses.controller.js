// src/modules/expenses/expenses.controller.js
const expenseService = require('./expenses.service');
const ApiResponse = require('../../utils/ApiResponse');

class ExpenseController {
  async listExpenses(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, farmId, categoryId, batchId, fromDate, toDate } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'expenseDate',
        sortOrder: sortOrder || 'desc',
        farmId: farmId ? parseInt(farmId) : undefined,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        batchId: batchId ? parseInt(batchId) : undefined,
        fromDate,
        toDate,
      };
      const result = await expenseService.listExpenses(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Expenses retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getExpense(req, res, next) {
    try {
      const { id } = req.params;
      const expense = await expenseService.getExpenseById(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, expense, 'Expense retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createExpense(req, res, next) {
    try {
      const expense = await expenseService.createExpense(req.body, req.user);
      res.status(201).json(new ApiResponse(201, expense, 'Expense created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateExpense(req, res, next) {
    try {
      const { id } = req.params;
      const expense = await expenseService.updateExpense(parseInt(id), req.body, req.user);
      res.status(200).json(new ApiResponse(200, expense, 'Expense updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteExpense(req, res, next) {
    try {
      const { id } = req.params;
      await expenseService.deleteExpense(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, null, 'Expense deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getExpenseStats(req, res, next) {
    try {
      const { farmId } = req.params;
      const { fromDate, toDate } = req.query;
      const stats = await expenseService.getExpenseStats(parseInt(farmId), fromDate, toDate, req.user);
      res.status(200).json(new ApiResponse(200, stats, 'Expense statistics retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExpenseController();