// src/modules/mortality-vaccination/vaccinations/vaccinations.service.js
const vaccinationRepository = require('./vaccinations.repository');
const scheduleRepository = require('../vaccination-schedules/vaccination-schedules.repository');
const runRepository = require('../../runs/runs.repository');
const userRepository = require('../../users/users.repository');
const ApiError = require('../../../utils/ApiError');
const prisma = require('../../../config/prisma');

class VaccinationService {
  async listVaccinations(filters, currentUser) {
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
        if (!hasAccess) {
          throw new ApiError(403, 'You do not have access to this farm');
        }
      }
    } else {
      throw new ApiError(403, 'You do not have permission to view vaccinations');
    }

    return vaccinationRepository.findAll({ ...rest, farmId });
  }

  async getVaccinationById(id, currentUser) {
    const vaccination = await vaccinationRepository.findById(id);
    if (!vaccination) {
      throw new ApiError(404, 'Vaccination record not found');
    }

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, vaccination.farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this vaccination record');
      }
    }
    return vaccination;
  }

  async createVaccination(data, currentUser) {
    // Only system_admin, owner, and manager can create
    if (!['system_admin', 'owner', 'manager'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to record vaccinations');
    }

    // Convert date
    if (data.administeredDate) {
      data.administeredDate = new Date(data.administeredDate);
      if (isNaN(data.administeredDate.getTime())) {
        throw new ApiError(400, 'Invalid administered date format');
      }
    } else {
      data.administeredDate = new Date();
    }

    // Check farm access
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, data.farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this farm');
      }
    }

    // Validate schedule exists and belongs to the farm
    const schedule = await scheduleRepository.findById(data.scheduleId);
    if (!schedule) {
      throw new ApiError(404, 'Vaccination schedule not found');
    }
    if (schedule.farmId !== data.farmId) {
      throw new ApiError(400, 'Schedule does not belong to the specified farm');
    }

    // Validate run (if provided)
    if (data.runId) {
      const run = await runRepository.findById(data.runId);
      if (!run) {
        throw new ApiError(404, 'Run not found');
      }
      if (run.house.farmId !== data.farmId) {
        throw new ApiError(400, 'Run does not belong to the specified farm');
      }
    }

    // Check if schedule is already done
    if (schedule.status === 'done') {
      throw new ApiError(409, 'This schedule has already been marked as done');
    }

    data.administeredBy = currentUser.id;

    // Use transaction: create vaccination and update schedule status to 'done'
    return prisma.$transaction(async (tx) => {
      const vaccination = await tx.vaccination.create({
        data,
        include: {
          schedule: { include: { vaccine: true, batch: true } },
          run: { include: { house: true } },
          administrator: { select: { id: true, fullName: true } },
          farm: { select: { id: true, name: true } },
        },
      });

      // Update schedule status to 'done'
      await tx.vaccinationSchedule.update({
        where: { id: data.scheduleId },
        data: { status: 'done' },
      });

      return vaccination;
    });
  }

  async updateVaccination(id, data, currentUser) {
    // Only system_admin and owner can update (not manager)
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to update vaccination records');
    }

    const vaccination = await vaccinationRepository.findById(id);
    if (!vaccination) {
      throw new ApiError(404, 'Vaccination record not found');
    }

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, vaccination.farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this vaccination record');
      }
    }

    // Only allow updates to notes, dosage, administeredDate
    const { scheduleId, runId, administeredBy, ...updateData } = data;
    if (scheduleId !== undefined) {
      throw new ApiError(400, 'Cannot change scheduleId – please delete and recreate');
    }
    if (runId !== undefined) {
      // Allow changing run? Possibly but we need to validate. We'll allow.
      if (runId) {
        const run = await runRepository.findById(runId);
        if (!run) {
          throw new ApiError(404, 'Run not found');
        }
        if (run.house.farmId !== vaccination.farmId) {
          throw new ApiError(400, 'Run does not belong to the same farm');
        }
        updateData.runId = runId;
      } else {
        updateData.runId = null;
      }
    }

    if (data.administeredDate) {
      data.administeredDate = new Date(data.administeredDate);
      if (isNaN(data.administeredDate.getTime())) {
        throw new ApiError(400, 'Invalid administered date format');
      }
    }

    return vaccinationRepository.update(id, updateData);
  }

  async deleteVaccination(id, currentUser) {
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete vaccination records');
    }

    const vaccination = await vaccinationRepository.findById(id);
    if (!vaccination) {
      throw new ApiError(404, 'Vaccination record not found');
    }

    // Deleting a vaccination should revert schedule status? That's tricky.
    // We'll allow deletion but not auto‑revert; admin can manually update schedule status.

    return vaccinationRepository.delete(id);
  }
}

module.exports = new VaccinationService();