// src/modules/houses/houses.controller.js
const houseService = require('./houses.service');
const ApiResponse = require('../../utils/ApiResponse');

class HouseController {
  async listHouses(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, search, farmId, isActive } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
        search,
        farmId: farmId ? parseInt(farmId) : undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      };
      const result = await houseService.listHouses(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Houses retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getHouse(req, res, next) {
    try {
      const { id } = req.params;
      const house = await houseService.getHouseById(id, req.user);
      res.status(200).json(new ApiResponse(200, house, 'House retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createHouse(req, res, next) {
    try {
      const house = await houseService.createHouse(req.body, req.user);
      res.status(201).json(new ApiResponse(201, house, 'House created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateHouse(req, res, next) {
    try {
      const { id } = req.params;
      const house = await houseService.updateHouse(id, req.body, req.user);
      res.status(200).json(new ApiResponse(200, house, 'House updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteHouse(req, res, next) {
    try {
      const { id } = req.params;
      await houseService.deleteHouse(id, req.user);
      res.status(200).json(new ApiResponse(200, null, 'House deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getRunsByHouse(req, res, next) {
    try {
      const { id } = req.params;
      const runs = await houseService.getRunsByHouse(id, req.user);
      res.status(200).json(new ApiResponse(200, runs, 'Runs retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HouseController();