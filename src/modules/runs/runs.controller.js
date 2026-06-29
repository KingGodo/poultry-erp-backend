// src/modules/runs/runs.controller.js
const runService = require('./runs.service');
const ApiResponse = require('../../utils/ApiResponse');

class RunController {
  async listRuns(req, res, next) {
    try {
      const {
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        houseId,
        farmId,
        status,
        runType,
        minCapacity,
        maxCapacity,
        hasBirds,
      } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
        search,
        houseId: houseId ? parseInt(houseId) : undefined,
        farmId: farmId ? parseInt(farmId) : undefined,
        status,
        runType,
        minCapacity: minCapacity ? parseInt(minCapacity) : undefined,
        maxCapacity: maxCapacity ? parseInt(maxCapacity) : undefined,
        hasBirds: hasBirds === 'true',
      };
      const result = await runService.listRuns(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Runs retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getRun(req, res, next) {
    try {
      const { id } = req.params;
      const run = await runService.getRunById(id, req.user);
      res.status(200).json(new ApiResponse(200, run, 'Run retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createRun(req, res, next) {
    try {
      const run = await runService.createRun(req.body, req.user);
      res.status(201).json(new ApiResponse(201, run, 'Run created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateRun(req, res, next) {
    try {
      const { id } = req.params;
      const run = await runService.updateRun(id, req.body, req.user);
      res.status(200).json(new ApiResponse(200, run, 'Run updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteRun(req, res, next) {
    try {
      const { id } = req.params;
      await runService.deleteRun(id, req.user);
      res.status(200).json(new ApiResponse(200, null, 'Run deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateRunStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const run = await runService.updateRunStatus(id, status, req.user);
      res.status(200).json(new ApiResponse(200, run, 'Run status updated successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RunController();