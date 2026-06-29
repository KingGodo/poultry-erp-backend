// src/modules/batches/batches.controller.js
const batchService = require('./batches.service');
const ApiResponse = require('../../utils/ApiResponse');

class BatchController {
  async listBatches(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, search, farmId, status, batchType, supplierId, fromDate, toDate } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
        search,
        farmId: farmId ? parseInt(farmId) : undefined,
        status,
        batchType,
        supplierId: supplierId ? parseInt(supplierId) : undefined,
        fromDate,
        toDate,
      };
      const result = await batchService.listBatches(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Batches retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getBatch(req, res, next) {
    try {
      const { id } = req.params;
      const batch = await batchService.getBatchById(id, req.user);
      res.status(200).json(new ApiResponse(200, batch, 'Batch retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createBatch(req, res, next) {
    try {
      const batch = await batchService.createBatch(req.body, req.user);
      res.status(201).json(new ApiResponse(201, batch, 'Batch created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateBatch(req, res, next) {
    try {
      const { id } = req.params;
      const batch = await batchService.updateBatch(id, req.body, req.user);
      res.status(200).json(new ApiResponse(200, batch, 'Batch updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteBatch(req, res, next) {
    try {
      const { id } = req.params;
      await batchService.deleteBatch(id, req.user);
      res.status(200).json(new ApiResponse(200, null, 'Batch deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateBatchStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const batch = await batchService.updateBatchStatus(id, status, req.user);
      res.status(200).json(new ApiResponse(200, batch, 'Batch status updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getBatchStats(req, res, next) {
    try {
      const { farmId } = req.params;
      const stats = await batchService.getBatchStats(farmId, req.user);
      res.status(200).json(new ApiResponse(200, stats, 'Batch statistics retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BatchController();