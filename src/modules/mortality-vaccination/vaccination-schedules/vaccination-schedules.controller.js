// src/modules/mortality-vaccination/vaccination-schedules/vaccination-schedules.controller.js
const scheduleService = require('./vaccination-schedules.service');
const ApiResponse = require('../../../utils/ApiResponse');

class VaccinationScheduleController {
  async listSchedules(req, res, next) {
    try {
      const {
        page,
        limit,
        sortBy,
        sortOrder,
        farmId,
        batchId,
        vaccineId,
        status,
        fromDate,
        toDate,
      } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'scheduledDate',
        sortOrder: sortOrder || 'asc',
        farmId: farmId ? parseInt(farmId) : undefined,
        batchId: batchId ? parseInt(batchId) : undefined,
        vaccineId: vaccineId ? parseInt(vaccineId) : undefined,
        status,
        fromDate,
        toDate,
      };
      const result = await scheduleService.listSchedules(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Vaccination schedules retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getSchedule(req, res, next) {
    try {
      const { id } = req.params;
      const schedule = await scheduleService.getScheduleById(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, schedule, 'Vaccination schedule retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createSchedule(req, res, next) {
    try {
      const schedule = await scheduleService.createSchedule(req.body, req.user);
      res.status(201).json(new ApiResponse(201, schedule, 'Vaccination schedule created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateSchedule(req, res, next) {
    try {
      const { id } = req.params;
      const schedule = await scheduleService.updateSchedule(parseInt(id), req.body, req.user);
      res.status(200).json(new ApiResponse(200, schedule, 'Vaccination schedule updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteSchedule(req, res, next) {
    try {
      const { id } = req.params;
      await scheduleService.deleteSchedule(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, null, 'Vaccination schedule deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateScheduleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const schedule = await scheduleService.updateScheduleStatus(parseInt(id), status, req.user);
      res.status(200).json(new ApiResponse(200, schedule, 'Schedule status updated successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VaccinationScheduleController();