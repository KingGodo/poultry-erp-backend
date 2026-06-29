// src/modules/batches/batches.service.js
const batchRepository = require('./batches.repository');
const userRepository = require('../users/users.repository');
const ApiError = require('../../utils/ApiError');

class BatchService {
  async listBatches(filters, currentUser) {
    let { farmId, ...rest } = filters;

    if (currentUser.role === 'system_admin') {
      // no filter
    } else if (['owner', 'manager'].includes(currentUser.role)) {
      const userFarms = await userRepository.findUserFarms(currentUser.id);
      const farmIds = userFarms.map(f => f.farmId);
      if (!farmId) {
        if (farmIds.length > 0) farmId = farmIds[0];
      } else {
        const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
        if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
      }
    } else if (currentUser.role === 'staff') {
      const userFarms = await userRepository.findUserFarms(currentUser.id);
      const farmIds = userFarms.map(f => f.farmId);
      if (farmIds.length > 0) farmId = farmIds[0];
      else throw new ApiError(403, 'You do not have access to any farm');
    } else {
      throw new ApiError(403, 'You do not have permission to view batches');
    }

    return batchRepository.findAll({ ...rest, farmId });
  }

  async getBatchById(id, currentUser) {
    const batch = await batchRepository.findById(id);
    if (!batch) throw new ApiError(404, 'Batch not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, batch.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this batch');
    }
    return batch;
  }

  async createBatch(data, currentUser) {
    if (data.arrivalDate) {
      data.arrivalDate = new Date(data.arrivalDate);
      if (isNaN(data.arrivalDate.getTime())) {
        throw new ApiError(400, 'Invalid arrival date format');
      }
    }

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, data.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }

    const existing = await batchRepository.findByCode(data.farmId, data.batchCode);
    if (existing) throw new ApiError(409, 'Batch code already exists for this farm');

    data.createdBy = currentUser.id;
    return batchRepository.create(data);
  }

  async updateBatch(id, data, currentUser) {
    if (data.arrivalDate) {
      data.arrivalDate = new Date(data.arrivalDate);
      if (isNaN(data.arrivalDate.getTime())) {
        throw new ApiError(400, 'Invalid arrival date format');
      }
    }

    const batch = await batchRepository.findById(id);
    if (!batch) throw new ApiError(404, 'Batch not found');

    if (currentUser.role === 'system_admin') {
      // allowed
    } else if (currentUser.role === 'owner') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, batch.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this batch');
    } else if (currentUser.role === 'manager') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, batch.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this batch');
      const restricted = ['quantityReceived', 'costPerChick', 'supplierId', 'batchCode', 'breed', 'arrivalDate'];
      for (const field of restricted) {
        if (data[field] !== undefined) {
          throw new ApiError(403, `Manager cannot update ${field}`);
        }
      }
    } else {
      throw new ApiError(403, 'You do not have permission to update this batch');
    }

    return batchRepository.update(id, data);
  }

  async deleteBatch(id, currentUser) {
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete batches');
    }
    const batch = await batchRepository.findById(id);
    if (!batch) throw new ApiError(404, 'Batch not found');
    if (batch.allocations && batch.allocations.length > 0) {
      throw new ApiError(400, 'Cannot delete batch with active allocations');
    }
    return batchRepository.softDelete(id);
  }

  async updateBatchStatus(id, status, currentUser) {
    const batch = await batchRepository.findById(id);
    if (!batch) throw new ApiError(404, 'Batch not found');

    if (currentUser.role === 'system_admin') {
      // allowed
    } else if (currentUser.role === 'owner') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, batch.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this batch');
    } else {
      throw new ApiError(403, 'You do not have permission to change batch status');
    }

    const validTransitions = {
      active: ['closed', 'archived'],
      closed: ['archived'],
      archived: [],
    };
    if (validTransitions[batch.status] && !validTransitions[batch.status].includes(status)) {
      throw new ApiError(400, `Invalid status transition from ${batch.status} to ${status}`);
    }

    return batchRepository.updateStatus(id, status);
  }

  async getBatchStats(farmId, currentUser) {
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }
    return batchRepository.getBatchStats(farmId);
  }
}

module.exports = new BatchService();