// src/modules/mortality-vaccination/mortality-records/mortality-records.service.js
const recordRepository = require('./mortality-records.repository');
const userRepository = require('../../users/users.repository');
const batchRepository = require('../../batches/batches.repository');
const runRepository = require('../../runs/runs.repository');
const ApiError = require('../../../utils/ApiError');
const prisma = require('../../../config/prisma');

class MortalityRecordService {
  async listRecords(filters, currentUser) {
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
      throw new ApiError(403, 'You do not have permission to view mortality records');
    }
    return recordRepository.findAll({ ...rest, farmId });
  }

  async getRecordById(id, currentUser) {
    const record = await recordRepository.findById(id);
    if (!record) throw new ApiError(404, 'Mortality record not found');
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, record.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this record');
    }
    return record;
  }

  async createRecord(data, currentUser) {
    if (currentUser.role === 'staff') {
      throw new ApiError(403, 'Staff cannot create mortality records');
    }
    if (data.recordedDate) {
      data.recordedDate = new Date(data.recordedDate);
      if (isNaN(data.recordedDate.getTime())) throw new ApiError(400, 'Invalid recorded date format');
    } else {
      data.recordedDate = new Date();
    }
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, data.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }
    const batch = await batchRepository.findById(data.batchId);
    if (!batch) throw new ApiError(404, 'Batch not found');
    if (batch.farmId !== data.farmId) throw new ApiError(400, 'Batch does not belong to the farm');

    const run = await runRepository.findById(data.runId);
    if (!run) throw new ApiError(404, 'Run not found');
    if (run.house.farmId !== data.farmId) throw new ApiError(400, 'Run does not belong to the farm');

    if (run.currentBirds < data.quantityDead) {
      throw new ApiError(400, `Insufficient birds in run. Available: ${run.currentBirds}`);
    }
    if (batch.quantityAlive < data.quantityDead) {
      throw new ApiError(400, `Insufficient birds in batch. Available: ${batch.quantityAlive}`);
    }

    data.recordedBy = currentUser.id;

    return prisma.$transaction(async (tx) => {
      const record = await tx.mortalityRecord.create({
        data,
        include: {
          farm: { select: { id: true, name: true } },
          run: { include: { house: true } },
          batch: { select: { id: true, batchCode: true, breed: true } },
          reasonCode: true,
          recorder: { select: { id: true, fullName: true } },
        },
      });
      await tx.run.update({
        where: { id: data.runId },
        data: { currentBirds: run.currentBirds - data.quantityDead },
      });
      await tx.batch.update({
        where: { id: data.batchId },
        data: {
          quantityAlive: batch.quantityAlive - data.quantityDead,
          quantityDead: batch.quantityDead + data.quantityDead,
        },
      });
      return record;
    });
  }

  async updateRecord(id, data, currentUser) {
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to update mortality records');
    }
    const record = await recordRepository.findById(id);
    if (!record) throw new ApiError(404, 'Mortality record not found');
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, record.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this record');
    }
    const { quantityDead, ...updateData } = data;
    if (quantityDead !== undefined) {
      throw new ApiError(400, 'Cannot update quantity – adjust via delete and create new record');
    }
    if (data.recordedDate) {
      data.recordedDate = new Date(data.recordedDate);
      if (isNaN(data.recordedDate.getTime())) throw new ApiError(400, 'Invalid recorded date format');
    }
    return recordRepository.update(id, updateData);
  }

  async deleteRecord(id, currentUser) {
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete mortality records');
    }
    const record = await recordRepository.findById(id);
    if (!record) throw new ApiError(404, 'Mortality record not found');
    const run = await runRepository.findById(record.runId);
    const batch = await batchRepository.findById(record.batchId);
    return prisma.$transaction(async (tx) => {
      await tx.run.update({
        where: { id: record.runId },
        data: { currentBirds: run.currentBirds + record.quantityDead },
      });
      await tx.batch.update({
        where: { id: record.batchId },
        data: {
          quantityAlive: batch.quantityAlive + record.quantityDead,
          quantityDead: batch.quantityDead - record.quantityDead,
        },
      });
      await tx.mortalityRecord.delete({ where: { id } });
      return true;
    });
  }
}

module.exports = new MortalityRecordService();