// src/modules/inventory-items/inventory-items.controller.js
const itemService = require('./inventory-items.service');
const ApiResponse = require('../../utils/ApiResponse');

class InventoryItemController {
  async listItems(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, search, farmId, category, lowStock } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'name',
        sortOrder: sortOrder || 'asc',
        search,
        farmId: farmId ? parseInt(farmId) : undefined,
        category,
        lowStock: lowStock === 'true',
      };
      const result = await itemService.listItems(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Inventory items retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getItem(req, res, next) {
    try {
      const { id } = req.params;
      const item = await itemService.getItemById(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, item, 'Inventory item retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createItem(req, res, next) {
    try {
      const item = await itemService.createItem(req.body, req.user);
      res.status(201).json(new ApiResponse(201, item, 'Inventory item created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req, res, next) {
    try {
      const { id } = req.params;
      const item = await itemService.updateItem(parseInt(id), req.body, req.user);
      res.status(200).json(new ApiResponse(200, item, 'Inventory item updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteItem(req, res, next) {
    try {
      const { id } = req.params;
      await itemService.deleteItem(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, null, 'Inventory item deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryItemController();