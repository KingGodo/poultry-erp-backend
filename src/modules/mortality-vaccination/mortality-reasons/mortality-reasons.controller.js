const reasonService = require('./mortality-reasons.service');
const ApiResponse = require('../../../utils/ApiResponse');

class MortalityReasonController {
  async listReasons(req, res, next) {
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
      const result = await reasonService.listReasons(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Mortality reasons retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getReason(req, res, next) {
    try {
      const { id } = req.params;
      const reason = await reasonService.getReasonById(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, reason, 'Mortality reason retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createReason(req, res, next) {
    try {
      const reason = await reasonService.createReason(req.body, req.user);
      res.status(201).json(new ApiResponse(201, reason, 'Mortality reason created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateReason(req, res, next) {
    try {
      const { id } = req.params;
      const reason = await reasonService.updateReason(parseInt(id), req.body, req.user);
      res.status(200).json(new ApiResponse(200, reason, 'Mortality reason updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteReason(req, res, next) {
    try {
      const { id } = req.params;
      await reasonService.deleteReason(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, null, 'Mortality reason deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MortalityReasonController();