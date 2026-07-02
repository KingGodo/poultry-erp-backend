// src/modules/sales/sales.service.js
const salesRepository = require('./sales.repository');
const userRepository = require('../users/users.repository');
const batchRepository = require('../batches/batches.repository');
const runRepository = require('../runs/runs.repository');
const ApiError = require('../../utils/ApiError');
const prisma = require('../../config/prisma');

class SalesService {
  async listSales(filters, currentUser) {
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
      throw new ApiError(403, 'You do not have permission to view sales');
    }

    return salesRepository.findAll({ ...rest, farmId });
  }

  async getSaleById(id, currentUser) {
    const sale = await salesRepository.findById(id);
    if (!sale) throw new ApiError(404, 'Sale not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, sale.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this sale');
    }
    return sale;
  }

  async createSale(data, currentUser) {
    if (!['system_admin', 'owner', 'manager'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to record sales');
    }

    // Convert date
    if (data.saleDate) {
      data.saleDate = new Date(data.saleDate);
      if (isNaN(data.saleDate.getTime())) throw new ApiError(400, 'Invalid sale date format');
    } else {
      data.saleDate = new Date();
    }

    // Farm access
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, data.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }

    // Validate customer (if provided)
    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
      });
      if (!customer) throw new ApiError(404, 'Customer not found');
      if (customer.farmId !== data.farmId) throw new ApiError(400, 'Customer does not belong to the farm');
    }

    // Bird sales: validate batch/run and update counts
    if (data.productType === 'bird') {
      if (!data.batchId) throw new ApiError(400, 'batchId is required for bird sales');
      if (!data.runId) throw new ApiError(400, 'runId is required for bird sales');

      const batch = await batchRepository.findById(data.batchId);
      if (!batch) throw new ApiError(404, 'Batch not found');
      if (batch.farmId !== data.farmId) throw new ApiError(400, 'Batch does not belong to the farm');
      if (batch.status !== 'active') throw new ApiError(400, 'Batch is not active');

      const run = await runRepository.findById(data.runId);
      if (!run) throw new ApiError(404, 'Run not found');
      if (run.house.farmId !== data.farmId) throw new ApiError(400, 'Run does not belong to the farm');

      if (run.currentBirds < data.quantitySold) {
        throw new ApiError(400, `Insufficient birds in run. Available: ${run.currentBirds}`);
      }
      if (batch.quantityAlive < data.quantitySold) {
        throw new ApiError(400, `Insufficient birds in batch. Available: ${batch.quantityAlive}`);
      }

      // Calculate total
      if (data.priceBasis === 'per_kg') {
        if (!data.totalWeightKg) throw new ApiError(400, 'totalWeightKg is required for per_kg pricing');
        data.totalAmount = data.totalWeightKg * data.unitPrice;
      } else {
        data.totalAmount = data.quantitySold * data.unitPrice;
      }

      data.recordedBy = currentUser.id;

      return prisma.$transaction(async (tx) => {
        const sale = await tx.sale.create({
          data,
          include: {
            farm: { select: { id: true, name: true } },
            batch: { select: { id: true, batchCode: true, breed: true } },
            run: { select: { id: true, name: true } },
            customer: { select: { id: true, name: true } },
            recorder: { select: { id: true, fullName: true } },
          },
        });

        await tx.run.update({
          where: { id: data.runId },
          data: { currentBirds: run.currentBirds - data.quantitySold },
        });

        await tx.batch.update({
          where: { id: data.batchId },
          data: {
            quantitySold: batch.quantitySold + data.quantitySold,
            quantityAlive: batch.quantityAlive - data.quantitySold,
          },
        });

        return sale;
      });
    } else {
      // Egg sales – no bird count updates
      if (data.priceBasis === 'per_kg') {
        if (!data.totalWeightKg) throw new ApiError(400, 'totalWeightKg required for per_kg pricing');
        data.totalAmount = data.totalWeightKg * data.unitPrice;
      } else {
        data.totalAmount = data.quantitySold * data.unitPrice;
      }

      data.recordedBy = currentUser.id;
      return salesRepository.create(data);
    }
  }

  async updateSale(id, data, currentUser) {
    if (!['system_admin', 'owner'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to update sales');
    }

    const sale = await salesRepository.findById(id);
    if (!sale) throw new ApiError(404, 'Sale not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, sale.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this sale');
    }

    // For bird sales, disallow updates that would affect stock
    if (sale.productType === 'bird') {
      const restricted = ['quantitySold', 'unitPrice', 'totalWeightKg', 'batchId', 'runId'];
      for (const field of restricted) {
        if (data[field] !== undefined) {
          throw new ApiError(400, `Cannot update ${field} for bird sales – delete and recreate`);
        }
      }
    }

    // Only allow customerId and saleDate updates
    const allowed = ['customerId', 'saleDate'];
    const updateData = {};
    for (const key of allowed) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }
    if (data.saleDate) {
      updateData.saleDate = new Date(data.saleDate);
      if (isNaN(updateData.saleDate.getTime())) throw new ApiError(400, 'Invalid sale date format');
    }

    return salesRepository.update(id, updateData);
  }

  async deleteSale(id, currentUser) {
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete sales');
    }

    const sale = await salesRepository.findById(id);
    if (!sale) throw new ApiError(404, 'Sale not found');
    if (sale.deletedAt) throw new ApiError(400, 'Sale already deleted');

    // Bird sale: revert counts
    if (sale.productType === 'bird') {
      const run = await runRepository.findById(sale.runId);
      const batch = await batchRepository.findById(sale.batchId);

      return prisma.$transaction(async (tx) => {
        await tx.sale.update({
          where: { id },
          data: { deletedAt: new Date() },
        });

        await tx.run.update({
          where: { id: sale.runId },
          data: { currentBirds: run.currentBirds + sale.quantitySold },
        });

        await tx.batch.update({
          where: { id: sale.batchId },
          data: {
            quantitySold: batch.quantitySold - sale.quantitySold,
            quantityAlive: batch.quantityAlive + sale.quantitySold,
          },
        });

        return true;
      });
    } else {
      // Egg sale: just soft delete
      return salesRepository.softDelete(id);
    }
  }

  async getSalesStats(farmId, fromDate, toDate, currentUser) {
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }
    return salesRepository.getStats(farmId, fromDate, toDate);
  }
}

module.exports = new SalesService();