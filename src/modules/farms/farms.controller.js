// src/modules/farms/farms.controller.js
const farmService = require('./farms.service');
const ApiResponse = require('../../utils/ApiResponse');

class FarmController {
  async listFarms(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, search, ownerId, status } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
        search,
        ownerId: ownerId ? parseInt(ownerId) : undefined,
        status,
      };
      const result = await farmService.listFarms(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Farms retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getFarm(req, res, next) {
    try {
      const { id } = req.params;
      const farm = await farmService.getFarmById(id, req.user);
      res.status(200).json(new ApiResponse(200, farm, 'Farm retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createFarm(req, res, next) {
    try {
      const farm = await farmService.createFarm(req.body, req.user);
      res.status(201).json(new ApiResponse(201, farm, 'Farm created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateFarm(req, res, next) {
    try {
      const { id } = req.params;
      const farm = await farmService.updateFarm(id, req.body, req.user);
      res.status(200).json(new ApiResponse(200, farm, 'Farm updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteFarm(req, res, next) {
    try {
      const { id } = req.params;
      await farmService.deleteFarm(id, req.user);
      res.status(200).json(new ApiResponse(200, null, 'Farm deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getFarmUsers(req, res, next) {
    try {
      const { id } = req.params;
      const users = await farmService.getFarmUsers(id, req.user);
      res.status(200).json(new ApiResponse(200, users, 'Farm users retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateFarmSettings(req, res, next) {
    try {
      const { id } = req.params;
      const farm = await farmService.updateFarmSettings(id, req.body, req.user);
      res.status(200).json(new ApiResponse(200, farm, 'Farm settings updated successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FarmController();