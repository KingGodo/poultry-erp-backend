// src/modules/customers/customers.service.js
const customerRepository = require('./customers.repository');
const userRepository = require('../users/users.repository');
const ApiError = require('../../utils/ApiError');

class CustomerService {
  async listCustomers(filters, currentUser) {
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
      throw new ApiError(403, 'You do not have permission to view customers');
    }

    return customerRepository.findAll({ ...rest, farmId });
  }

  async getCustomerById(id, currentUser) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw new ApiError(404, 'Customer not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, customer.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this customer');
    }
    return customer;
  }

  async createCustomer(data, currentUser) {
    // Only system_admin, owner, manager can create
    if (!['system_admin', 'owner', 'manager'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to create customers');
    }

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, data.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this farm');
    }

    return customerRepository.create(data);
  }

  async updateCustomer(id, data, currentUser) {
    if (!['system_admin', 'owner', 'manager'].includes(currentUser.role)) {
      throw new ApiError(403, 'You do not have permission to update customers');
    }

    const customer = await customerRepository.findById(id);
    if (!customer) throw new ApiError(404, 'Customer not found');

    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, customer.farmId);
      if (!hasAccess) throw new ApiError(403, 'You do not have access to this customer');
    }

    return customerRepository.update(id, data);
  }

  async deleteCustomer(id, currentUser) {
    if (currentUser.role !== 'system_admin') {
      throw new ApiError(403, 'Only system administrators can delete customers');
    }

    const customer = await customerRepository.findById(id);
    if (!customer) throw new ApiError(404, 'Customer not found');

    // Check if customer has sales – if yes, prevent deletion
    if (customer._count.sales > 0) {
      throw new ApiError(400, 'Cannot delete customer with existing sales');
    }

    return customerRepository.delete(id);
  }
}

module.exports = new CustomerService();