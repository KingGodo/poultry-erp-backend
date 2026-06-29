const feedStockService = require('./feed-stock.service');
const ApiResponse = require('../../../utils/ApiResponse');

class FeedStockController {
  async listStock(req, res, next) {
    try {
      const { farmId, feedTypeId, lowStock, page, limit } = req.query;
      const filters = {
        farmId: farmId ? parseInt(farmId) : undefined,
        feedTypeId: feedTypeId ? parseInt(feedTypeId) : undefined,
        lowStock: lowStock === 'true',
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      };
      const result = await feedStockService.listStock(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Feed stock retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getStock(req, res, next) {
    try {
      const { id } = req.params;
      const stock = await feedStockService.getStockById(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, stock, 'Feed stock retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateReorderLevel(req, res, next) {
    try {
      const { id } = req.params;
      const { reorderLevel } = req.body;
      const stock = await feedStockService.updateReorderLevel(parseInt(id), reorderLevel, req.user);
      res.status(200).json(new ApiResponse(200, stock, 'Reorder level updated successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeedStockController();