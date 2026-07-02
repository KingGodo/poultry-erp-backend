// src/modules/expense-categories/expense-categories.service.js
const categoryRepository = require('./expense-categories.repository');
const userRepository = require('../users/users.repository');
const ApiError = require('../../utils/ApiError');

class ExpenseCategoryService {
  async listCategories(filters, currentUser) {
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
      throw new ApiError(403, 'You do not have permission to view expense categories');
    }

    return categoryRepository.findAll({ ...rest, farmId });
  }

  async getCategoryById(id, currentUser) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new ApiError(404, 'Expense category not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, category.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this category');
    }
    return category;
  }

  async createCategory(data, currentUser) {
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to create expense categories');
    }

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, data.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }

    const existing = await categoryRepository.findByName(data.farmId, data.name);
    if (existing) throw new ApiError(409, 'Expense category with this name already exists in this farm');

    return categoryRepository.create(data);
  }

  async updateCategory(id, data, currentUser) {
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to update expense categories');
    }

    const category = await categoryRepository.findById(id);
    if (!category) throw new ApiError(404, 'Expense category not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, category.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this category');
    }

    if (data.name && data.name !== category.name) {
      const existing = await categoryRepository.findByName(category.farmId, data.name);
      if (existing) throw new ApiError(409, 'Expense category with this name already exists in this farm');
    }

    return categoryRepository.update(id, data);
  }

  async deleteCategory(id, currentUser) {
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete expense categories');
    }

    const category = await categoryRepository.findById(id);
    if (!category) throw new ApiError(404, 'Expense category not found');

    if (category._count.expenses > 0) {
      throw new ApiError(400, 'Cannot delete category with existing expenses');
    }

    return categoryRepository.delete(id);
  }
}

module.exports = new ExpenseCategoryService();