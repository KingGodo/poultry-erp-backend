// src/modules/mortality-vaccination/vaccinations/vaccinations.controller.js
const vaccinationService = require('./vaccinations.service');
const ApiResponse = require('../../../utils/ApiResponse');

class VaccinationController {
  async listVaccinations(req, res, next) {
    try {
      const {
        page,
        limit,
        sortBy,
        sortOrder,
        farmId,
        batchId,
        scheduleId,
        runId,
        fromDate,
        toDate,
      } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'administeredDate',
        sortOrder: sortOrder || 'desc',
        farmId: farmId ? parseInt(farmId) : undefined,
        batchId: batchId ? parseInt(batchId) : undefined,
        scheduleId: scheduleId ? parseInt(scheduleId) : undefined,
        runId: runId ? parseInt(runId) : undefined,
        fromDate,
        toDate,
      };
      const result = await vaccinationService.listVaccinations(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Vaccinations retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getVaccination(req, res, next) {
    try {
      const { id } = req.params;
      const vaccination = await vaccinationService.getVaccinationById(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, vaccination, 'Vaccination record retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createVaccination(req, res, next) {
    try {
      const vaccination = await vaccinationService.createVaccination(req.body, req.user);
      res.status(201).json(new ApiResponse(201, vaccination, 'Vaccination recorded successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateVaccination(req, res, next) {
    try {
      const { id } = req.params;
      const vaccination = await vaccinationService.updateVaccination(parseInt(id), req.body, req.user);
      res.status(200).json(new ApiResponse(200, vaccination, 'Vaccination updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteVaccination(req, res, next) {
    try {
      const { id } = req.params;
      await vaccinationService.deleteVaccination(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, null, 'Vaccination deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VaccinationController();