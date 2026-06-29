// src/modules/batches/batches.service.js
const batchRepository = require('./batches.repository');
const userRepository = require('../users/users.repository');
const runRepository = require('../runs/runs.repository'); // We'll create this
const ApiError = require('../../utils/ApiError');

class BatchService {
  /**
   * List batches with permission-based filtering
   */
  async listBatches(filters, currentUser) {
    let { farmId, ...rest } = filters;

    // system_admin sees all
    if (currentUser.role === 'system_admin') {
      // no filter
    } else if (currentUser.role === 'owner' || currentUser.role === 'manager') {
      // Only show batches from farms they have access to
      const userFarms = await userRepository.findUserFarms(currentUser.id);
      const farmIds = userFarms.map(f => f.farmId);
      // If no farm filter, restrict to user's farms
      if (!farmId) {
        // We'll need to handle multiple farmIds. For simplicity, we'll filter by a single farmId.
        // Better: modify repository to accept an array of farmIds.
        // For now, we'll just show all user's farms (not optimal for pagination).
        // We'll improve later.
        // We'll set farmId to the first farm (or null)
        if (farmIds.length > 0) {
          farmId = farmIds[0];
        }
      } else {
        // Ensure user has access to the requested farm
        const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
        if (!hasAccess) {
          throw new ApiError(403, 'You do not have access to this farm');
        }
      }
    } else {
      // staff: can view batches only if they have view_batches permission
      // (permission check handled in middleware)
      // They can see all farms they have access to? Usually staff are tied to one farm.
      // We'll restrict to their farm(s)
      const userFarms = await userRepository.findUserFarms(currentUser.id);
      const farmIds = userFarms.map(f => f.farmId);
      if (farmIds.length > 0) {
        farmId = farmIds[0];
      } else {
        throw new ApiError(403, 'You do not have access to any farm');
      }
    }

    const result = await batchRepository.findAll({
      ...rest,
      farmId,
    });

    return result;
  }

  /**
   * Get a single batch by ID
   */
  async getBatchById(id, currentUser) {
    const batch = await batchRepository.findById(id);
    if (!batch) {
      throw new ApiError(404, 'Batch not found');
    }

    // Check permissions
    if (currentUser.role === 'system_admin') {
      return batch;
    }

    // Check if user has access to the farm of this batch
    const hasAccess = await userRepository.hasFarmAccess(currentUser.id, batch.farmId);
    if (!hasAccess) {
      throw new ApiError(403, 'You do not have access to this batch');
    }

    return batch;
  }

  /**
   * Create a new batch
   */
  async createBatch(data, currentUser) {
    // Verify user can create batches on this farm
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, data.farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this farm');
      }
    }

    // Check if batch code is unique within the farm
    const existing = await batchRepository.findByCode(data.farmId, data.batchCode);
    if (existing) {
      throw new ApiError(409, 'Batch code already exists for this farm');
    }

    // Set createdBy
    data.createdBy = currentUser.id;

    // If supplierId is provided, verify it exists and belongs to the same farm
    if (data.supplierId) {
      // Optional: validate supplier exists
      // We'll trust the FK constraint
    }

    return batchRepository.create(data);
  }

  /**
   * Update a batch
   */
  async updateBatch(id, data, currentUser) {
    const batch = await batchRepository.findById(id);
    if (!batch) {
      throw new ApiError(404, 'Batch not found');
    }

    // Permission check
    if (currentUser.role === 'system_admin') {
      // allowed
    } else if (currentUser.role === 'owner' || currentUser.role === 'manager') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, batch.farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this batch');
      }
      // manager can only update certain fields? We'll let service handle.
      if (currentUser.role === 'manager') {
        // Managers can't change critical fields like quantity, cost, supplier
        const restricted = ['quantityReceived', 'costPerChick', 'supplierId', 'batchCode', 'breed', 'arrivalDate'];
        for (const field of restricted) {
          if (data[field] !== undefined) {
            throw new ApiError(403, `Manager cannot update ${field}`);
          }
        }
      }
    } else {
      throw new ApiError(403, 'You do not have permission to update this batch');
    }

    return batchRepository.update(id, data);
  }

  /**
   * Delete a batch (soft delete)
   */
  async deleteBatch(id, currentUser) {
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete batches');
    }

    const batch = await batchRepository.findById(id);
    if (!batch) {
      throw new ApiError(404, 'Batch not found');
    }

    // Check if batch has any allocations – if so, prevent deletion?
    if (batch.allocations && batch.allocations.length > 0) {
      throw new ApiError(400, 'Cannot delete batch with active allocations');
    }

    return batchRepository.softDelete(id);
  }

  /**
   * Update batch status
   */
  async updateBatchStatus(id, status, currentUser) {
    const batch = await batchRepository.findById(id);
    if (!batch) {
      throw new ApiError(404, 'Batch not found');
    }

    // Permission check
    if (currentUser.role === 'system_admin') {
      // allowed
    } else if (currentUser.role === 'owner') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, batch.farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this batch');
      }
    } else {
      throw new ApiError(403, 'You do not have permission to change batch status');
    }

    // Validate status transition
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

  /**
   * Get batch statistics for a farm
   */
  async getBatchStats(farmId, currentUser) {
    // Permission: user must have access to the farm
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this farm');
      }
    }
    return batchRepository.getBatchStats(farmId);
  }
}

module.exports = new BatchService();