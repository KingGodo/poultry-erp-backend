// src/modules/sales/sales.controller.js
const salesService = require('./sales.service');
const ApiResponse = require('../../utils/ApiResponse');

class SalesController {
  async listSales(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, farmId, productType, customerId, batchId, runId, fromDate, toDate } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'saleDate',
        sortOrder: sortOrder || 'desc',
        farmId: farmId ? parseInt(farmId) : undefined,
        productType,
        customerId: customerId ? parseInt(customerId) : undefined,
        batchId: batchId ? parseInt(batchId) : undefined,
        runId: runId ? parseInt(runId) : undefined,
        fromDate,
        toDate,
      };
      const result = await salesService.listSales(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Sales retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getSale(req, res, next) {
    try {
      const { id } = req.params;
      const sale = await salesService.getSaleById(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, sale, 'Sale retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createSale(req, res, next) {
    try {
      const sale = await salesService.createSale(req.body, req.user);
      res.status(201).json(new ApiResponse(201, sale, 'Sale recorded successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateSale(req, res, next) {
    try {
      const { id } = req.params;
      const sale = await salesService.updateSale(parseInt(id), req.body, req.user);
      res.status(200).json(new ApiResponse(200, sale, 'Sale updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteSale(req, res, next) {
    try {
      const { id } = req.params;
      await salesService.deleteSale(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, null, 'Sale deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getSalesStats(req, res, next) {
    try {
      const { farmId } = req.params;
      const { fromDate, toDate } = req.query;
      const stats = await salesService.getSalesStats(parseInt(farmId), fromDate, toDate, req.user);
      res.status(200).json(new ApiResponse(200, stats, 'Sales statistics retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SalesController();