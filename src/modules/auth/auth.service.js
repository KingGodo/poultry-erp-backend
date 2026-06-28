const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken } = require('../../utils/generateToken');
const authRepository = require('./auth.repository');
const ApiError = require('../../utils/ApiError');
const prisma = require('../../config/prisma');

class AuthService {
  async register(data) {
    // Check if user exists
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Check if this is the first user (system owner)
    const userCount = await authRepository.countUsers();
    const isFirstUser = userCount === 0;

    // Get appropriate role
    const role = isFirstUser 
      ? await authRepository.getOwnerRole()
      : await authRepository.getDefaultRole();

    if (!role) {
      throw new ApiError(500, 'Default role not found. Please seed roles first.');
    }

    // Start transaction
    return prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || null,
          passwordHash: hashedPassword,
          roleId: role.id,
          status: 'active'
        }
      });

      // Create farm
      const farm = await tx.farm.create({
        data: {
          name: data.farm.name,
          location: data.farm.location || null,
          contactPhone: data.farm.contactPhone || null,
          currency: data.farm.currency || 'USD',
          timezone: data.farm.timezone || 'UTC',
          ownerId: user.id,
          isActive: true
        }
      });

      // Grant user access to farm
      await tx.userFarmAccess.create({
        data: {
          userId: user.id,
          farmId: farm.id,
          roleId: role.id,
          isDefault: true
        }
      });

      // Return user with relations
      return tx.user.findUnique({
        where: { id: user.id },
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
    });
  }

  async login(email, password) {
    const user = await authRepository.findUserByEmail(email);
    
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new ApiError(403, 'Account is inactive or suspended');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Update last login
    await authRepository.updateUser(user.id, {
      lastLoginAt: new Date()
    });

    // Get default farm
    const defaultFarm = user.userFarmAccess.find(access => access.isDefault)?.farm;
    
    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role.name,
      farmId: defaultFarm?.id || null
    });

    const refreshToken = generateRefreshToken({
      id: user.id
    });

    // Prepare user data for response (excluding sensitive info)
    const { passwordHash: _, ...userData } = user;

    return {
      user: userData,
      accessToken,
      refreshToken,
      defaultFarm: defaultFarm ? {
        id: defaultFarm.id,
        name: defaultFarm.name
      } : null
    };
  }

  async refreshToken(refreshToken) {
    // Verify refresh token (will be done in controller)
    // This method is just a placeholder; actual verification is in controller
    return { message: 'Token refreshed' };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await authRepository.updateUser(userId, { passwordHash: hashedPassword });

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    const { passwordHash: _, ...userData } = user;
    return userData;
  }
}

module.exports = new AuthService();