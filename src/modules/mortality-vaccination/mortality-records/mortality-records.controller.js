const recordService = require('./mortality-records.service');
const ApiResponse = require('../../../utils/ApiResponse');

class MortalityRecordController {
  async listRecords(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, farmId, runId, batchId, reasonCodeId, fromDate, toDate } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'recordedDate',
        sortOrder: sortOrder || 'desc',
        farmId: farmId ? parseInt(farmId) : undefined,
        runId: runId ? parseInt(runId) : undefined,
        batchId: batchId ? parseInt(batchId) : undefined,
        reasonCodeId: reasonCodeId ? parseInt(reasonCodeId) : undefined,
        fromDate,
        toDate,
      };
      const result = await recordService.listRecords(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Mortality records retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getRecord(req, res, next) {
    try {
      const { id } = req.params;
      const record = await recordService.getRecordById(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, record, 'Mortality record retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  async createRecord(req, res, next) {
    try {
      const record = await recordService.createRecord(req.body, req.user);
      res.status(201).json(new ApiResponse(201, record, 'Mortality record created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateRecord(req, res, next) {
    try {
      const { id } = req.params;
      const record = await recordService.updateRecord(parseInt(id), req.body, req.user);
      res.status(200).json(new ApiResponse(200, record, 'Mortality record updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteRecord(req, res, next) {
    try {
      const { id } = req.params;
      await recordService.deleteRecord(parseInt(id), req.user);
      res.status(200).json(new ApiResponse(200, null, 'Mortality record deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MortalityRecordController();