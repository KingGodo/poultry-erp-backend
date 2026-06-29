const feedTypeService = require('./feed-types.service');
const ApiResponse = require('../../../utils/ApiResponse');

class FeedTypeController {
  async listFeedTypes(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, search, farmId } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
        search,
        farmId: farmId ? parseInt(farmId) : undefined,
      };
      const result = await feedTypeService.listFeedTypes(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Feed types retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getFeedType(req, res, next) {
    try {
      const { id } = req.params;
      const feedType = await feedTypeService.getFeedTypeById(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, feedType, 'Feed type retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createFeedType(req, res, next) {
    try {
      const feedType = await feedTypeService.createFeedType(req.body, req.user);
      res.status(201).json(new ApiResponse(201, feedType, 'Feed type created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateFeedType(req, res, next) {
    try {
      const { id } = req.params;
      const feedType = await feedTypeService.updateFeedType(parseInt(id), req.body, req.user);
      res.status(200).json(new ApiResponse(200, feedType, 'Feed type updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteFeedType(req, res, next) {
    try {
      const { id } = req.params;
      await feedTypeService.deleteFeedType(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, null, 'Feed type deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeedTypeController();