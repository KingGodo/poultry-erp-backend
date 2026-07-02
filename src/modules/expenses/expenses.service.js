// src/modules/expenses/expenses.service.js
const expenseRepository = require('./expenses.repository');
const userRepository = require('../users/users.repository');
const categoryRepository = require('../expense-categories/expense-categories.repository');
const batchRepository = require('../batches/batches.repository');
const ApiError = require('../../utils/ApiError');

class ExpenseService {
  async listExpenses(filters, currentUser) {
    let { farmId, ...rest } = filters;

    if (currentUser.role === 'system_admin') {
      // no filter
    } else if (['owner', 'manager', 'staff'].includes(currentUser.role)) {
      const userFarms = await userRepository.findUserFarms(currentUser.id);
      const farmIds = userFarms.map(f => f.farmId);
      if (!farmId) {
        if (farmIds.length > 0) farmId = farmIds[0];
      } else {
        const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
        if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
      }
    } else {
      throw new ApiError(403, 'You do not have permission to view expenses');
    }

    return expenseRepository.findAll({ ...rest, farmId });
  }

  async getExpenseById(id, currentUser) {
    const expense = await expenseRepository.findById(id);
    if (!expense) throw new ApiError(404, 'Expense not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, expense.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this expense');
    }
    return expense;
  }

  async createExpense(data, currentUser) {
    if (!['system_admin', 'owner', 'manager'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to create expenses');
    }

    if (data.expenseDate) {
      data.expenseDate = new Date(data.expenseDate);
      if (isNaN(data.expenseDate.getTime())) throw new ApiError(400, 'Invalid expense date format');
    } else {
      data.expenseDate = new Date();
    }

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, data.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }

    // Validate category – ✅ fixed BigInt comparison
    const category = await categoryRepository.findById(data.categoryId);
    if (!category) throw new ApiError(404, 'Expense category not found');
    if (Number(category.farmId) !== Number(data.farmId)) {
      throw new ApiError(400, 'Category does not belong to the farm');
    }

    // Validate batch (if provided) – ✅ fixed BigInt comparison
    if (data.batchId) {
      const batch = await batchRepository.findById(data.batchId);
      if (!batch) throw new ApiError(404, 'Batch not found');
      if (Number(batch.farmId) !== Number(data.farmId)) {
        throw new ApiError(400, 'Batch does not belong to the farm');
      }
    }

    data.recordedBy = currentUser.id;

    return expenseRepository.create(data);
  }

  async updateExpense(id, data, currentUser) {
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to update expenses');
    }

    const expense = await expenseRepository.findById(id);
    if (!expense) throw new ApiError(404, 'Expense not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, expense.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this expense');
    }

    // Only allow updating certain fields
    const allowed = ['amount', 'description', 'expenseDate', 'categoryId', 'batchId'];
    const updateData = {};
    for (const key of allowed) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }

    if (data.expenseDate) {
      updateData.expenseDate = new Date(data.expenseDate);
      if (isNaN(updateData.expenseDate.getTime())) throw new ApiError(400, 'Invalid expense date format');
    }

    // Validate category if changed – ✅ fixed BigInt comparison
    if (data.categoryId) {
      const category = await categoryRepository.findById(data.categoryId);
      if (!category) throw new ApiError(404, 'Expense category not found');
      if (Number(category.farmId) !== Number(expense.farmId)) {
        throw new ApiError(400, 'Category does not belong to the farm');
      }
    }

    // Validate batch if changed – ✅ fixed BigInt comparison
    if (data.batchId) {
      const batch = await batchRepository.findById(data.batchId);
      if (!batch) throw new ApiError(404, 'Batch not found');
      if (Number(batch.farmId) !== Number(expense.farmId)) {
        throw new ApiError(400, 'Batch does not belong to the farm');
      }
    }

    return expenseRepository.update(id, updateData);
  }

  async deleteExpense(id, currentUser) {
    if (currentUser.role !== 'system_admin' && currentUser.role !== 'owner') {
      throw new ApiError(403, 'You do not have permission to delete expenses');
    }

    const expense = await expenseRepository.findById(id);
    if (!expense) throw new ApiError(404, 'Expense not found');

    if (currentUser.role !== 'system_admin') {
      const hasPermission = currentUser.permissions && currentUser.permissions.includes('delete_financial_record');
      if (!hasPermission) {
        throw new ApiError(403, 'You do not have permission to delete expenses');
      }
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, expense.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this expense');
    }

    if (expense.deletedAt) throw new ApiError(400, 'Expense already deleted');

    return expenseRepository.softDelete(id);
  }

  async getExpenseStats(farmId, fromDate, toDate, currentUser) {
    if (currentUser.role !== 'system_admin' && currentUser.role !== 'owner') {
      throw new ApiError(403, 'You do not have permission to view expense statistics');
    }

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }

    return expenseRepository.getStats(farmId, fromDate, toDate);
  }
}

module.exports = new ExpenseService();