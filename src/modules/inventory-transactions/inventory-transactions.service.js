// src/modules/inventory-transactions/inventory-transactions.service.js
const transactionRepository = require('./inventory-transactions.repository');
const itemRepository = require('../inventory-items/inventory-items.repository');
const userRepository = require('../users/users.repository');
const ApiError = require('../../utils/ApiError');
const prisma = require('../../config/prisma');

class InventoryTransactionService {
  async listTransactions(filters, currentUser) {
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
      throw new ApiError(403, 'You do not have permission to view inventory transactions');
    }

    return transactionRepository.findAll({ ...rest, farmId });
  }

  async getTransactionById(id, currentUser) {
    const transaction = await transactionRepository.findById(id);
    if (!transaction) throw new ApiError(404, 'Inventory transaction not found');

    const item = await itemRepository.findById(transaction.inventoryItemId);
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, item.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this transaction');
    }
    return transaction;
  }

  async createTransaction(data, currentUser) {
    if (!['system_admin', 'owner', 'manager'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to create inventory transactions');
    }

    if (data.transactionDate) {
      data.transactionDate = new Date(data.transactionDate);
      if (isNaN(data.transactionDate.getTime())) throw new ApiError(400, 'Invalid transaction date format');
    } else {
      data.transactionDate = new Date();
    }

    const item = await itemRepository.findById(data.inventoryItemId);
    if (!item) throw new ApiError(404, 'Inventory item not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, item.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }

    if (data.transactionType === 'out') {
      if (item.quantity < data.quantity) {
        throw new ApiError(400, `Insufficient stock. Available: ${item.quantity}, Requested: ${data.quantity}`);
      }
    }

    // ✅ Add farmId to the data (required by the Prisma schema)
    data.farmId = Number(item.farmId);

    data.recordedBy = currentUser.id;

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.create({
        data,
        include: {
          item: { select: { id: true, name: true, unit: true } },
          recorder: { select: { id: true, fullName: true } },
        },
      });

      const newQuantity = data.transactionType === 'in'
        ? item.quantity + data.quantity
        : item.quantity - data.quantity;

      await tx.inventoryItem.update({
        where: { id: data.inventoryItemId },
        data: { quantity: newQuantity },
      });

      return transaction;
    });
  }

  async deleteTransaction(id, currentUser) {
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete inventory transactions');
    }

    const transaction = await transactionRepository.findById(id);
    if (!transaction) throw new ApiError(404, 'Inventory transaction not found');

    const item = await itemRepository.findById(transaction.inventoryItemId);

    const revertQuantity = transaction.transactionType === 'in'
      ? item.quantity - transaction.quantity
      : item.quantity + transaction.quantity;

    if (revertQuantity < 0) {
      throw new ApiError(400, 'Cannot delete transaction – would result in negative stock');
    }

    return prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { id: transaction.inventoryItemId },
        data: { quantity: revertQuantity },
      });
      await tx.inventoryTransaction.delete({ where: { id } });
      return true;
    });
  }
}

module.exports = new InventoryTransactionService();