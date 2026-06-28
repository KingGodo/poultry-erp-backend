const prisma = require('../../config/prisma');

class AuthRepository {
  async findUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        userFarmAccess: {
          include: {
            farm: true,
            role: true
          }
        }
      }
    });
  }

  async findUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        userFarmAccess: {
          include: {
            farm: true,
            role: true
          }
        }
      }
    });
  }

  async createUser(data) {
    return prisma.user.create({
      data
    });
  }

  async createFarm(data) {
    return prisma.farm.create({
      data
    });
  }

  async createUserFarmAccess(data) {
    return prisma.userFarmAccess.create({
      data
    });
  }

  async updateUser(id, data) {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  async countUsers() {
    return prisma.user.count();
  }

  async getDefaultRole() {
    return prisma.role.findFirst({
      where: { name: 'staff' }
    });
  }

  async getOwnerRole() {
    return prisma.role.findFirst({
      where: { name: 'owner' }
    });
  }
}

module.exports = new AuthRepository();