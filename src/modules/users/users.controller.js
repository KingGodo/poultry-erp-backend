// src/modules/users/users.controller.js
const userService = require('./users.service');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

class UserController {
  /**
   * List users with pagination and filters
   */
  async listUsers(req, res, next) {
    try {
      const { page, limit, sortBy, sortOrder, search, role, status, farmId } = req.query;
      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
        search,
        role,
        status,
        farmId: farmId ? parseInt(farmId) : undefined,
      };
      const result = await userService.listUsers(filters, req.user);
      res.status(200).json(new ApiResponse(200, result, 'Users retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single user by ID
   */
  async getUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id, req.user);
      res.status(200).json(new ApiResponse(200, user, 'User retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new user
   */
  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body, req.user);
      res.status(201).json(new ApiResponse(201, user, 'User created successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a user
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.updateUser(id, req.body, req.user);
      res.status(200).json(new ApiResponse(200, user, 'User updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a user (soft delete)
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id, req.user);
      res.status(200).json(new ApiResponse(200, null, 'User deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user role (admin only)
   */
  async changeRole(req, res, next) {
    try {
      const { id } = req.params;
      const { roleId } = req.body;
      const user = await userService.changeRole(id, roleId, req.user);
      res.status(200).json(new ApiResponse(200, user, 'User role updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user status
   */
  async changeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = await userService.changeStatus(id, status, req.user);
      res.status(200).json(new ApiResponse(200, user, 'User status updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get farms of a user
   */
  async getUserFarms(req, res, next) {
    try {
      const { id } = req.params;
      const farms = await userService.getUserFarms(id, req.user);
      res.status(200).json(new ApiResponse(200, farms, 'User farms retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add farm access to a user
   */
  async addFarmAccess(req, res, next) {
    try {
      const { id } = req.params;
      const { farmId, roleId } = req.body;
      const access = await userService.addFarmAccess(id, farmId, roleId, req.user);
      res.status(201).json(new ApiResponse(201, access, 'Farm access granted successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove farm access from a user
   */
  async removeFarmAccess(req, res, next) {
    try {
      const { id } = req.params;
      const { farmId } = req.body;
      await userService.removeFarmAccess(id, farmId, req.user);
      res.status(200).json(new ApiResponse(200, null, 'Farm access revoked successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all farms (dropdown)
   */
  async getAllFarms(req, res, next) {
    try {
      const farms = await userService.getAllFarms(req.user);
      res.status(200).json(new ApiResponse(200, farms, 'Farms retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all roles (dropdown)
   */
  async getAllRoles(req, res, next) {
    try {
      const roles = await userService.getAllRoles(req.user);
      res.status(200).json(new ApiResponse(200, roles, 'Roles retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();