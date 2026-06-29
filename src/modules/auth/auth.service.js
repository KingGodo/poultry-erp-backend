const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken } = require('../../utils/generateToken');
const authRepository = require('./auth.repository');
const ApiError = require('../../utils/ApiError');
const prisma = require('../../config/prisma');

class AuthService {
  /**
   * Register a new user with their own farm.
   * Always assigns the 'owner' role to the new user.
   */
  async register(data) {
    // Check if user exists
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Get the "owner" role (must exist in the database)
    const ownerRole = await authRepository.getOwnerRole();
    if (!ownerRole) {
      throw new ApiError(500, 'Owner role not found. Please seed roles first.');
    }

    // Start transaction (all or nothing)
    return prisma.$transaction(async (tx) => {
      // Create user with owner role
      const user = await tx.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || null,
          passwordHash: hashedPassword,
          roleId: ownerRole.id,
          status: 'active',
        },
      });

      // Create farm owned by the user
      const farm = await tx.farm.create({
        data: {
          name: data.farm.name,
          location: data.farm.location || null,
          contactPhone: data.farm.contactPhone || null,
          currency: data.farm.currency || 'USD',
          timezone: data.farm.timezone || 'UTC',
          ownerId: user.id,
          isActive: true,
        },
      });

      // Grant the user access to the farm with the owner role
      await tx.userFarmAccess.create({
        data: {
          userId: user.id,
          farmId: farm.id,
          roleId: ownerRole.id,
          isDefault: true,
        },
      });

      // Return the complete user object with relations
      return tx.user.findUnique({
        where: { id: user.id },
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
          userFarmAccess: {
            include: {
              farm: true,
              role: true,
            },
          },
        },
      });
    });
  }

  /**
   * Log in a user with email and password.
   */
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

    // Update last login timestamp
    await authRepository.updateUser(user.id, {
      lastLoginAt: new Date(),
    });

    // Get default farm (the one marked as isDefault)
    const defaultFarm = user.userFarmAccess.find((access) => access.isDefault)?.farm;

    // Generate JWT tokens
    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role.name,
      farmId: defaultFarm?.id || null,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
    });

    // Remove password hash from user data
    const { passwordHash: _, ...userData } = user;

    return {
      user: userData,
      accessToken,
      refreshToken,
      defaultFarm: defaultFarm
        ? {
            id: defaultFarm.id,
            name: defaultFarm.name,
          }
        : null,
    };
  }

  /**
   * Refresh access token using a valid refresh token.
   * (Actual verification is done in the controller.)
   */
  async refreshToken(refreshToken) {
    // This is a placeholder – the controller will handle verification
    return { message: 'Token refreshed' };
  }

  /**
   * Change the password of an authenticated user.
   */
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

  /**
   * Get the profile of the authenticated user.
   */
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