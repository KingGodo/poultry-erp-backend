const feedDistributionService = require('./feed-distributions.service');
const ApiResponse = require('../../../utils/ApiResponse');

class FeedDistributionController {
  async listDistributions(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, farmId, runId, feedTypeId, fromDate, toDate } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'distributedDate',
        sortOrder: sortOrder || 'desc',
        farmId: farmId ? parseInt(farmId) : undefined,
        runId: runId ? parseInt(runId) : undefined,
        feedTypeId: feedTypeId ? parseInt(feedTypeId) : undefined,
        fromDate,
        toDate,
      };
      const result = await feedDistributionService.listDistributions(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Feed distributions retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getDistribution(req, res, next) {
    try {
      const { id } = req.params;
      const distribution = await feedDistributionService.getDistributionById(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, distribution, 'Feed distribution retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createDistribution(req, res, next) {
    try {
      const distribution = await feedDistributionService.createDistribution(req.body, req.user);
      res.status(201).json(new ApiResponse(201, distribution, 'Feed distribution created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateDistribution(req, res, next) {
    try {
      const { id } = req.params;
      const distribution = await feedDistributionService.updateDistribution(parseInt(id), req.body, req.user);
      res.status(200).json(new ApiResponse(200, distribution, 'Feed distribution updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteDistribution(req, res, next) {
    try {
      const { id } = req.params;
      await feedDistributionService.deleteDistribution(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, null, 'Feed distribution deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getDistributionsByRun(req, res, next) {
    try {
      const { runId } = req.params;
      const distributions = await feedDistributionService.getDistributionsByRun(parseInt(runId), req.user);
      res.status(200).json(new ApiResponse(200, distributions, 'Distributions for run retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeedDistributionController();