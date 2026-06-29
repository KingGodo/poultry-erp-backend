const feedPurchaseService = require('./feed-purchases.service');
const ApiResponse = require('../../../utils/ApiResponse');

class FeedPurchaseController {
  async listPurchases(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, farmId, feedTypeId, supplierId, fromDate, toDate } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'purchaseDate',
        sortOrder: sortOrder || 'desc',
        farmId: farmId ? parseInt(farmId) : undefined,
        feedTypeId: feedTypeId ? parseInt(feedTypeId) : undefined,
        supplierId: supplierId ? parseInt(supplierId) : undefined,
        fromDate,
        toDate,
      };
      const result = await feedPurchaseService.listPurchases(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Feed purchases retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getPurchase(req, res, next) {
    try {
      const { id } = req.params;
      const purchase = await feedPurchaseService.getPurchaseById(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, purchase, 'Feed purchase retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createPurchase(req, res, next) {
    try {
      const purchase = await feedPurchaseService.createPurchase(req.body, req.user);
      res.status(201).json(new ApiResponse(201, purchase, 'Feed purchase created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updatePurchase(req, res, next) {
    try {
      const { id } = req.params;
      const purchase = await feedPurchaseService.updatePurchase(parseInt(id), req.body, req.user);
      res.status(200).json(new ApiResponse(200, purchase, 'Feed purchase updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deletePurchase(req, res, next) {
    try {
      const { id } = req.params;
      await feedPurchaseService.deletePurchase(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, null, 'Feed purchase deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeedPurchaseController();