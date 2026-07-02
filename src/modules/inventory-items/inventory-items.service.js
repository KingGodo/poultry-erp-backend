// src/modules/inventory-items/inventory-items.service.js
const itemRepository = require('./inventory-items.repository');
const userRepository = require('../users/users.repository');
const ApiError = require('../../utils/ApiError');

class InventoryItemService {
  async listItems(filters, currentUser) {
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
      throw new ApiError(403, 'You do not have permission to view inventory items');
    }

    return itemRepository.findAll({ ...rest, farmId });
  }

  async getItemById(id, currentUser) {
    const item = await itemRepository.findById(id);
    if (!item) throw new ApiError(404, 'Inventory item not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, item.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this item');
    }
    return item;
  }

  async createItem(data, currentUser) {
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to create inventory items');
    }

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, data.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }

    const existing = await itemRepository.findByName(data.farmId, data.name);
    if (existing) throw new ApiError(409, 'Inventory item with this name already exists in this farm');

    return itemRepository.create(data);
  }

  async updateItem(id, data, currentUser) {
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to update inventory items');
    }

    const item = await itemRepository.findById(id);
    if (!item) throw new ApiError(404, 'Inventory item not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, item.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this item');
    }

    if (data.name && data.name !== item.name) {
      const existing = await itemRepository.findByName(item.farmId, data.name);
      if (existing) throw new ApiError(409, 'Inventory item with this name already exists in this farm');
    }

    return itemRepository.update(id, data);
  }

  async deleteItem(id, currentUser) {
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete inventory items');
    }

    const item = await itemRepository.findById(id);
    if (!item) throw new ApiError(404, 'Inventory item not found');

    if (item._count.transactions > 0) {
      throw new ApiError(400, 'Cannot delete item with existing transactions');
    }

    return itemRepository.delete(id);
  }
}

module.exports = new InventoryItemService();