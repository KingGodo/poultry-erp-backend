// src/modules/mortality-vaccination/mortality-reasons/mortality-reasons.service.js
const reasonRepository = require('./mortality-reasons.repository');
const userRepository = require('../../users/users.repository');
const ApiError = require('../../../utils/ApiError');

class MortalityReasonService {
  async listReasons(filters, currentUser) {
    let { farmId, ...rest } = filters;
    if (currentUser.role === 'system_admin') {
      // no filter
    } else if (['owner', 'manager', 'staff'].includes(currentUser.role)) {
      const userFarms = await userRepository.findUserFarms(currentUser.id);
      const farmIds = userFarms.map(f => f.farmId);
      if (!farmId) {
        if (farmIds.length > 0) farmId = farmIds[0];
      } else {
        const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
        if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
      }
    } else {
      throw new ApiError(403, 'You do not have permission to view mortality reasons');
    }
    return reasonRepository.findAll({ ...rest, farmId });
  }

  async getReasonById(id, currentUser) {
    const reason = await reasonRepository.findById(id);
    if (!reason) throw new ApiError(404, 'Mortality reason not found');
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, reason.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this reason');
    }
    return reason;
  }

  async createReason(data, currentUser) {
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to create mortality reasons');
    }
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, data.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }
    const existing = await reasonRepository.findByCode(data.farmId, data.code);
    if (existing) throw new ApiError(409, 'Reason code already exists for this farm');
    return reasonRepository.create(data);
  }

  async updateReason(id, data, currentUser) {
    const reason = await reasonRepository.findById(id);
    if (!reason) throw new ApiError(404, 'Mortality reason not found');
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to update mortality reasons');
    }
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, reason.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this reason');
    }
    if (data.code && data.code !== reason.code) {
      const existing = await reasonRepository.findByCode(reason.farmId, data.code);
      if (existing) throw new ApiError(409, 'Reason code already exists for this farm');
    }
    return reasonRepository.update(id, data);
  }

  async deleteReason(id, currentUser) {
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete mortality reasons');
    }
    const reason = await reasonRepository.findById(id);
    if (!reason) throw new ApiError(404, 'Mortality reason not found');
    if (reason._count.records > 0) {
      throw new ApiError(400, 'Cannot delete reason that has associated mortality records');
    }
    return reasonRepository.delete(id);
  }
}

module.exports = new MortalityReasonService();