// src/modules/mortality-vaccination/vaccines/vaccines.service.js
const vaccineRepository = require('./vaccines.repository');
const userRepository = require('../../users/users.repository');
const ApiError = require('../../../utils/ApiError');

class VaccineService {
  async listVaccines(filters, currentUser) {
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
      throw new ApiError(403, 'You do not have permission to view vaccines');
    }
    return vaccineRepository.findAll({ ...rest, farmId });
  }

  async getVaccineById(id, currentUser) {
    const vaccine = await vaccineRepository.findById(id);
    if (!vaccine) throw new ApiError(404, 'Vaccine not found');
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, vaccine.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this vaccine');
    }
    return vaccine;
  }

  async createVaccine(data, currentUser) {
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to create vaccines');
    }
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, data.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }
    const existing = await vaccineRepository.findByName(data.farmId, data.name);
    if (existing) throw new ApiError(409, 'Vaccine with this name already exists in this farm');
    return vaccineRepository.create(data);
  }

  async updateVaccine(id, data, currentUser) {
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to update vaccines');
    }
    const vaccine = await vaccineRepository.findById(id);
    if (!vaccine) throw new ApiError(404, 'Vaccine not found');
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, vaccine.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this vaccine');
    }
    if (data.name && data.name !== vaccine.name) {
      const existing = await vaccineRepository.findByName(vaccine.farmId, data.name);
      if (existing) throw new ApiError(409, 'Vaccine with this name already exists in this farm');
    }
    return vaccineRepository.update(id, data);
  }

  async deleteVaccine(id, currentUser) {
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete vaccines');
    }
    const vaccine = await vaccineRepository.findById(id);
    if (!vaccine) throw new ApiError(404, 'Vaccine not found');
    if (vaccine._count.schedules > 0) {
      throw new ApiError(400, 'Cannot delete vaccine with associated vaccination schedules');
    }
    return vaccineRepository.delete(id);
  }
}

module.exports = new VaccineService();