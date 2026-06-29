// src/modules/users/users.repository.js
const prisma = require('../../config/prisma');

class UserRepository {
  /**
   * Find all users with filters, pagination, sorting
   */
  async findAll({
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    role,
    status,
    farmId,
  } = {}) {
    const skip = (page - 1) * limit;
    const take = limit;

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = { name: role };
    }

    if (status) {
      where.status = status;
    }

    // Farm filter: users who have access to a specific farm
    if (farmId) {
      where.userFarmAccess = {
        some: { farmId: BigInt(farmId) },
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          role: true,
          userFarmAccess: {
            include: {
              farm: true,
              role: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

   /**
   * Find a user by email
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Get a role by its ID
   */
  async getRoleById(id) {
    return prisma.role.findUnique({
      where: { id },
    });
  }

  /**
   * Get all farms a user has access to
   */
  async findUserFarms(userId) {
    return prisma.userFarmAccess.findMany({
      where: { userId: BigInt(userId) },
      include: {
        farm: true,
        role: true,
      },
    });
  }

  /**
   * Get all permissions for a user (via their role)
   */
  async getUserPermissions(userId) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
    if (!user) return [];
    return user.role.rolePermissions.map((rp) => rp.permission.permissionKey);
  }

  /**
   * Find a user by ID with relations
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id: BigInt(id) },
      include: {
        role: true,
        userFarmAccess: {
          include: {
            farm: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Create a new user (admin action)
   * Note: This does NOT create a farm; it assigns to existing farm(s)
   */
  async create(data) {
    return prisma.user.create({
      data,
      include: {
        role: true,
        userFarmAccess: {
          include: {
            farm: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Update a user (excluding password – handled separately)
   */
  async update(id, data) {
    return prisma.user.update({
      where: { id: BigInt(id) },
      data,
      include: {
        role: true,
        userFarmAccess: {
          include: {
            farm: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete a user
   */
  async softDelete(id) {
    // Update user status to 'inactive' – or you could add a deletedAt field
    // We'll just set status to 'inactive'
    return prisma.user.update({
      where: { id: BigInt(id) },
      data: { status: 'inactive' },
    });
  }

  /**
   * Change user role
   */
  async changeRole(id, roleId) {
    return prisma.user.update({
      where: { id: BigInt(id) },
      data: { roleId },
      include: {
        role: true,
      },
    });
  }

  /**
   * Change user status
   */
  async changeStatus(id, status) {
    return prisma.user.update({
      where: { id: BigInt(id) },
      data: { status },
    });
  }

  /**
   * Get role by name
   */
  async getRoleByName(name) {
    return prisma.role.findUnique({
      where: { name },
    });
  }

  /**
   * Check if a user has access to a farm
   */
  async hasFarmAccess(userId, farmId) {
    const access = await prisma.userFarmAccess.findUnique({
      where: {
        userId_farmId: {
          userId: BigInt(userId),
          farmId: BigInt(farmId),
        },
      },
    });
    return !!access;
  }

  /**
   * Grant user access to a farm (with a role)
   */
  async grantFarmAccess(userId, farmId, roleId) {
    return prisma.userFarmAccess.create({
      data: {
        userId: BigInt(userId),
        farmId: BigInt(farmId),
        roleId,
      },
    });
  }

  /**
   * Revoke user access to a farm
   */
  async revokeFarmAccess(userId, farmId) {
    return prisma.userFarmAccess.delete({
      where: {
        userId_farmId: {
          userId: BigInt(userId),
          farmId: BigInt(farmId),
        },
      },
    });
  }

  /**
   * Get all farms (for dropdown/list)
   */
  async getAllFarms() {
    return prisma.farm.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get all roles (for dropdown/list)
   */
  async getAllRoles() {
    return prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}

module.exports = new UserRepository();