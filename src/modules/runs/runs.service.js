// src/modules/runs/runs.service.js
const runRepository = require('./runs.repository');
const houseRepository = require('../houses/houses.repository');
const farmRepository = require('../farms/farms.repository');
const userRepository = require('../users/users.repository');
const ApiError = require('../../utils/ApiError');

class RunService {
  async listRuns(filters, currentUser) {
    // Permission check
    if (!['system_admin', 'owner', 'manager', 'staff'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to view runs');
    }

    let { farmId, houseId, ...rest } = filters;

    // If user is not system_admin, restrict to farms they have access to
    if (currentUser.role !== 'system_admin') {
      const userFarms = await farmRepository.getFarmsByUser(currentUser.id);
      const farmIds = userFarms.map(f => f.farmId);
      
      if (farmId) {
        const hasAccess = farmIds.some(id => id === BigInt(farmId));
        if (!hasAccess) {
          throw new ApiError(403, 'You do not have access to this farm');
        }
      } else {
        // If no farmId provided, restrict to farms they have access to
        if (farmIds.length === 0) {
          return { runs: [], total: 0, page: 1, limit: 10, totalPages: 0 };
        }
        // For simplicity, use first farm. We'll pass it as farmId.
        farmId = Number(farmIds[0]);
      }
    }

    // If houseId provided but user is not system_admin, verify access to that house's farm
    if (houseId && currentUser.role !== 'system_admin') {
      const house = await houseRepository.findById(houseId);
      if (!house) {
        throw new ApiError(404, 'House not found');
      }
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, house.farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this house');
      }
    }

    return runRepository.findAll({ ...rest, farmId, houseId });
  }

  async getRunById(id, currentUser) {
    const run = await runRepository.findById(id);
    if (!run) {
      throw new ApiError(404, 'Run not found');
    }

    // Check access
    if (currentUser.role === 'system_admin') {
      return run;
    }

    const hasAccess = await userRepository.hasFarmAccess(currentUser.id, run.house.farmId);
    if (!hasAccess) {
      throw new ApiError(403, 'You do not have access to this run');
    }

    return run;
  }

  async createRun(data, currentUser) {
    // Only system_admin or owner can create runs
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to create runs');
    }

    // Check if house exists
    const house = await houseRepository.findById(data.houseId);
    if (!house) {
      throw new ApiError(404, 'House not found');
    }

    // If user is owner, ensure they own the farm
    if (currentUser.role === 'owner') {
      const farm = await farmRepository.findById(house.farmId);
      if (!farm || farm.ownerId !== currentUser.id) {
        throw new ApiError(403, 'You do not own this farm');
      }
    }

    // Add createdBy if not provided
    if (!data.createdBy) {
      data.createdBy = currentUser.id;
    }

    // Set default values
    if (!data.status) data.status = 'empty';
    if (!data.runType) data.runType = 'broiler';
    if (!data.currentBirds) data.currentBirds = 0;

    return runRepository.create(data);
  }

  async updateRun(id, data, currentUser) {
    const run = await runRepository.findById(id);
    if (!run) {
      throw new ApiError(404, 'Run not found');
    }

    // Permission check
    if (currentUser.role === 'system_admin') {
      // Allowed
    } else if (currentUser.role === 'owner') {
      const farm = await farmRepository.findById(run.house.farmId);
      if (!farm || farm.ownerId !== currentUser.id) {
        throw new ApiError(403, 'You do not have permission to update this run');
      }
    } else {
      throw new ApiError(403, 'You do not have permission to update this run');
    }

    // Prevent changing houseId unless system_admin
    if (data.houseId && currentUser.role !== 'system_admin') {
      delete data.houseId;
    }

    // Validate capacity
    if (data.capacity !== undefined && data.capacity < 0) {
      throw new ApiError(400, 'Capacity must be a positive number');
    }

    // Validate currentBirds <= capacity
    if (data.currentBirds !== undefined) {
      const capacity = data.capacity !== undefined ? data.capacity : run.capacity;
      if (data.currentBirds > capacity) {
        throw new ApiError(400, 'Current birds cannot exceed capacity');
      }
    }

    return runRepository.update(id, data);
  }

  async deleteRun(id, currentUser) {
    // Only system_admin can delete runs
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete runs');
    }

    const run = await runRepository.findById(id);
    if (!run) {
      throw new ApiError(404, 'Run not found');
    }

    // Check if run has active allocations or birds
    if (run.currentBirds > 0) {
      throw new ApiError(400, 'Cannot delete a run with active birds');
    }

    return runRepository.softDelete(id);
  }

  async updateRunStatus(id, status, currentUser) {
    const run = await runRepository.findById(id);
    if (!run) {
      throw new ApiError(404, 'Run not found');
    }

    // Permission check
    if (currentUser.role === 'system_admin') {
      // Allowed
    } else if (currentUser.role === 'owner' || currentUser.role === 'manager') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, run.house.farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this run');
      }
    } else {
      throw new ApiError(403, 'You do not have permission to update run status');
    }

    // Validate status
    const validStatuses = ['empty', 'occupied', 'cleaning', 'maintenance'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, 'Invalid status. Allowed: empty, occupied, cleaning, maintenance');
    }

    return runRepository.updateStatus(id, status);
  }
}

module.exports = new RunService();