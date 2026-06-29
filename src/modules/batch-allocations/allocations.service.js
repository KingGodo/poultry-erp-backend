// src/modules/batch-allocations/allocations.service.js
const allocationRepository = require('./allocations.repository');
const batchRepository = require('../batches/batches.repository');
const runRepository = require('../runs/runs.repository');
const userRepository = require('../users/users.repository');
const ApiError = require('../../utils/ApiError');

class AllocationService {
  async listAllocations(filters, currentUser) {
    // Permission check: system_admin, owner, manager, staff (view_allocations)
    // We'll enforce via middleware, but also filter by farm if needed
    return allocationRepository.findAll(filters);
  }

  async getAllocationById(id, currentUser) {
    const allocation = await allocationRepository.findById(id);
    if (!allocation) {
      throw new ApiError(404, 'Allocation not found');
    }

    // Check if user has access to the farm of this allocation
    const farmId = allocation.batch.farmId;
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this allocation');
      }
    }

    return allocation;
  }

  async createAllocation(data, currentUser) {
    const { batchId, runId, quantity } = data;

    // Validate batch exists and is active
    const batch = await batchRepository.findById(batchId);
    if (!batch) {
      throw new ApiError(404, 'Batch not found');
    }
    if (batch.status !== 'active') {
      throw new ApiError(400, 'Cannot allocate to a non-active batch');
    }

    // Validate run exists and has capacity
    const run = await runRepository.findById(runId);
    if (!run) {
      throw new ApiError(404, 'Run not found');
    }
    if (run.status === 'maintenance' || run.status === 'cleaning') {
      throw new ApiError(400, `Run is currently ${run.status} – cannot allocate`);
    }

    // Check if user has access to the farm
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, batch.farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this farm');
      }
    }

    // Check if run has capacity
    if (run.currentBirds + quantity > run.capacity) {
      throw new ApiError(400, `Run capacity exceeded. Current: ${run.currentBirds}, Capacity: ${run.capacity}`);
    }

    // Check if batch has enough birds alive
    if (batch.quantityAlive < quantity) {
      throw new ApiError(400, `Insufficient birds in batch. Available: ${batch.quantityAlive}`);
    }

    // Check if allocation already exists for this batch and run
    const existing = await allocationRepository.findAll({ batchId, runId });
    if (existing.total > 0) {
      throw new ApiError(409, 'Batch already allocated to this run');
    }

    // Create allocation
    const allocation = await allocationRepository.create({
      batchId,
      runId,
      quantity,
      createdBy: currentUser.id,
      allocatedDate: new Date(),
    });

    // Update run currentBirds
    await runRepository.update(runId, {
      currentBirds: run.currentBirds + quantity,
    });

    // Update batch quantityAlive (decrease)
    await batchRepository.updateCounts(batchId, {
      quantityAlive: batch.quantityAlive - quantity,
    });

    // Update run status to 'occupied' if it was 'empty'
    if (run.status === 'empty') {
      await runRepository.updateStatus(runId, 'occupied');
    }

    return allocation;
  }

  async updateAllocation(id, data, currentUser) {
    const allocation = await allocationRepository.findById(id);
    if (!allocation) {
      throw new ApiError(404, 'Allocation not found');
    }

    // Permission check
    if (currentUser.role !== 'system_admin' && currentUser.role !== 'owner') {
      throw new ApiError(403, 'You do not have permission to update this allocation');
    }

    // Only allow quantity change
    if (data.quantity === undefined) {
      throw new ApiError(400, 'Only quantity can be updated');
    }

    const { quantity: newQuantity } = data;
    const oldQuantity = allocation.quantity;

    if (newQuantity === oldQuantity) {
      return allocation;
    }

    const batch = await batchRepository.findById(allocation.batchId);
    const run = await runRepository.findById(allocation.runId);

    // Check capacity
    const diff = newQuantity - oldQuantity;
    if (diff > 0) {
      // Increasing allocation
      if (run.currentBirds + diff > run.capacity) {
        throw new ApiError(400, 'Run capacity exceeded');
      }
      if (batch.quantityAlive < diff) {
        throw new ApiError(400, 'Insufficient birds in batch');
      }
    } else {
      // Decreasing allocation
      if (run.currentBirds + diff < 0) {
        throw new ApiError(400, 'Cannot remove more birds than currently allocated');
      }
    }

    // Update allocation
    const updated = await allocationRepository.update(id, { quantity: newQuantity });

    // Update run currentBirds
    await runRepository.update(run.id, {
      currentBirds: run.currentBirds + diff,
    });

    // Update batch quantityAlive
    await batchRepository.updateCounts(batch.id, {
      quantityAlive: batch.quantityAlive - diff,
    });

    return updated;
  }

  async deleteAllocation(id, currentUser) {
    if (currentUser.role !== 'system_admin' && currentUser.role !== 'owner') {
      throw new ApiError(403, 'You do not have permission to delete allocations');
    }

    const allocation = await allocationRepository.findById(id);
    if (!allocation) {
      throw new ApiError(404, 'Allocation not found');
    }

    // Revert changes to run and batch
    const run = await runRepository.findById(allocation.runId);
    const batch = await batchRepository.findById(allocation.batchId);

    // Remove birds from run
    await runRepository.update(run.id, {
      currentBirds: run.currentBirds - allocation.quantity,
    });

    // Add birds back to batch
    await batchRepository.updateCounts(batch.id, {
      quantityAlive: batch.quantityAlive + allocation.quantity,
    });

    // If run has no birds, set status to 'empty'
    if (run.currentBirds - allocation.quantity === 0) {
      await runRepository.updateStatus(run.id, 'empty');
    }

    return allocationRepository.delete(id);
  }
}

module.exports = new AllocationService();