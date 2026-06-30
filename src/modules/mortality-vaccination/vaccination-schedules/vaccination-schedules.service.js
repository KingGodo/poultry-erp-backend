// src/modules/mortality-vaccination/vaccination-schedules/vaccination-schedules.service.js
const scheduleRepository = require('./vaccination-schedules.repository');
const vaccineRepository = require('../vaccines/vaccines.repository');
const batchRepository = require('../../batches/batches.repository');
const userRepository = require('../../users/users.repository');
const ApiError = require('../../../utils/ApiError');

class VaccinationScheduleService {
  async listSchedules(filters, currentUser) {
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
      throw new ApiError(403, 'You do not have permission to view vaccination schedules');
    }
    return scheduleRepository.findAll({ ...rest, farmId });
  }

  async getScheduleById(id, currentUser) {
    const schedule = await scheduleRepository.findById(id);
    if (!schedule) throw new ApiError(404, 'Vaccination schedule not found');
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, schedule.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this schedule');
    }
    return schedule;
  }

  async createSchedule(data, currentUser) {
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to create vaccination schedules');
    }
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, data.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }
    const batch = await batchRepository.findById(data.batchId);
    if (!batch) throw new ApiError(404, 'Batch not found');
    if (batch.farmId !== data.farmId) throw new ApiError(400, 'Batch does not belong to the farm');

    const vaccine = await vaccineRepository.findById(data.vaccineId);
    if (!vaccine) throw new ApiError(404, 'Vaccine not found');
    if (vaccine.farmId !== data.farmId) throw new ApiError(400, 'Vaccine does not belong to the farm');

    if (data.scheduledDay === undefined) throw new ApiError(400, 'scheduledDay is required');
    if (data.scheduledDay < 0) throw new ApiError(400, 'scheduledDay must be non-negative');

    const arrivalDate = new Date(batch.arrivalDate);
    const scheduledDate = new Date(arrivalDate);
    scheduledDate.setDate(scheduledDate.getDate() + data.scheduledDay);
    data.scheduledDate = scheduledDate;
    data.status = data.status || 'pending';

    return scheduleRepository.create(data);
  }

  async updateSchedule(id, data, currentUser) {
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to update vaccination schedules');
    }
    const schedule = await scheduleRepository.findById(id);
    if (!schedule) throw new ApiError(404, 'Vaccination schedule not found');
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, schedule.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this schedule');
    }
    if (data.scheduledDay !== undefined) {
      if (data.scheduledDay < 0) throw new ApiError(400, 'scheduledDay must be non-negative');
      const batch = await batchRepository.findById(schedule.batchId);
      const arrivalDate = new Date(batch.arrivalDate);
      const scheduledDate = new Date(arrivalDate);
      scheduledDate.setDate(scheduledDate.getDate() + data.scheduledDay);
      data.scheduledDate = scheduledDate;
    }
    if (data.vaccineId && data.vaccineId !== schedule.vaccineId) {
      const vaccine = await vaccineRepository.findById(data.vaccineId);
      if (!vaccine) throw new ApiError(404, 'Vaccine not found');
      if (vaccine.farmId !== schedule.farmId) throw new ApiError(400, 'Vaccine does not belong to the same farm');
    }
    return scheduleRepository.update(id, data);
  }

  async deleteSchedule(id, currentUser) {
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete vaccination schedules');
    }
    const schedule = await scheduleRepository.findById(id);
    if (!schedule) throw new ApiError(404, 'Vaccination schedule not found');
    if (schedule.vaccinations && schedule.vaccinations.length > 0) {
      throw new ApiError(400, 'Cannot delete schedule with existing vaccination records');
    }
    return scheduleRepository.delete(id);
  }

  async updateScheduleStatus(id, status, currentUser) {
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to update schedule status');
    }
    const schedule = await scheduleRepository.findById(id);
    if (!schedule) throw new ApiError(404, 'Vaccination schedule not found');
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, schedule.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this schedule');
    }
    const valid = ['pending', 'done', 'overdue', 'skipped'];
    if (!valid.includes(status)) throw new ApiError(400, `Invalid status. Allowed: ${valid.join(', ')}`);
    return scheduleRepository.updateStatus(id, status);
  }
}

module.exports = new VaccinationScheduleService();