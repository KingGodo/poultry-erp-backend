// src/modules/batch-allocations/allocations.controller.js
const allocationService = require('./allocations.service');
const ApiResponse = require('../../utils/ApiResponse');

class AllocationController {
  async listAllocations(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, batchId, runId, farmId } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'allocatedDate',
        sortOrder: sortOrder || 'desc',
        batchId: batchId ? parseInt(batchId) : undefined,
        runId: runId ? parseInt(runId) : undefined,
        farmId: farmId ? parseInt(farmId) : undefined,
      };
      const result = await allocationService.listAllocations(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Allocations retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getAllocation(req, res, next) {
    try {
      const { id } = req.params;
      const allocation = await allocationService.getAllocationById(id, req.user);
      res.status(200).json(new ApiResponse(200, allocation, 'Allocation retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createAllocation(req, res, next) {
    try {
      const allocation = await allocationService.createAllocation(req.body, req.user);
      res.status(201).json(new ApiResponse(201, allocation, 'Allocation created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateAllocation(req, res, next) {
    try {
      const { id } = req.params;
      const allocation = await allocationService.updateAllocation(id, req.body, req.user);
      res.status(200).json(new ApiResponse(200, allocation, 'Allocation updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteAllocation(req, res, next) {
    try {
      const { id } = req.params;
      await allocationService.deleteAllocation(id, req.user);
      res.status(200).json(new ApiResponse(200, null, 'Allocation deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AllocationController();