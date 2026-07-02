// src/modules/expense-categories/expense-categories.controller.js
const categoryService = require('./expense-categories.service');
const ApiResponse = require('../../utils/ApiResponse');

class ExpenseCategoryController {
  async listCategories(req, res, next) {
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
      const result = await categoryService.listCategories(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Expense categories retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getCategory(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryById(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, category, 'Expense category retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body, req.user);
      res.status(201).json(new ApiResponse(201, category, 'Expense category created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.updateCategory(parseInt(id), req.body, req.user);
      res.status(200).json(new ApiResponse(200, category, 'Expense category updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      await categoryService.deleteCategory(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, null, 'Expense category deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExpenseCategoryController();