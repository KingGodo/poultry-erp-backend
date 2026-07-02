// src/modules/dashboard/dashboard.controller.js
const dashboardService = require('./dashboard.service');
const ApiResponse = require('../../utils/ApiResponse');

class DashboardController {
  async getDashboard(req, res, next) {
    try {
      const { farmId } = req.params;
      const data = await dashboardService.getDashboard(parseInt(farmId), req.user);
      res.status(200).json(new ApiResponse(200, data, 'Dashboard data retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getQuickStats(req, res, next) {
    try {
      const { farmId } = req.params;
      const data = await dashboardService.getQuickStats(parseInt(farmId), req.user);
      res.status(200).json(new ApiResponse(200, data, 'Quick stats retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();