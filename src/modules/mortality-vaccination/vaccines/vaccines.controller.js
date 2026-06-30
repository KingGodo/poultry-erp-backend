// src/modules/mortality-vaccination/vaccines/vaccines.controller.js
const vaccineService = require('./vaccines.service');
const ApiResponse = require('../../../utils/ApiResponse');

class VaccineController {
  async listVaccines(req, res, next) {
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
      const result = await vaccineService.listVaccines(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Vaccines retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getVaccine(req, res, next) {
    try {
      const { id } = req.params;
      const vaccine = await vaccineService.getVaccineById(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, vaccine, 'Vaccine retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createVaccine(req, res, next) {
    try {
      const vaccine = await vaccineService.createVaccine(req.body, req.user);
      res.status(201).json(new ApiResponse(201, vaccine, 'Vaccine created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateVaccine(req, res, next) {
    try {
      const { id } = req.params;
      const vaccine = await vaccineService.updateVaccine(parseInt(id), req.body, req.user);
      res.status(200).json(new ApiResponse(200, vaccine, 'Vaccine updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteVaccine(req, res, next) {
    try {
      const { id } = req.params;
      await vaccineService.deleteVaccine(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, null, 'Vaccine deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VaccineController();