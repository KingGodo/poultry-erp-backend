// src/modules/dashboard/dashboard.service.js
const prisma = require('../../config/prisma');
const userRepository = require('../users/users.repository');
const ApiError = require('../../utils/ApiError');

class DashboardService {
  /**
   * Get full dashboard data for a farm
   */
  async getDashboard(farmId, currentUser) {
    // Permission: check farm access
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this farm');
      }
    }

    const farmIdBigInt = BigInt(farmId);

    // Run all queries in parallel for performance
    const [
      birdStats,
      feedStats,
      financialStats,
      recentMortality,
      recentFeedDistributions,
      recentSales,
      upcomingVaccinations,
      lowStockItems,
      batchSummary,
    ] = await Promise.all([
      this.getBirdStats(farmIdBigInt),
      this.getFeedStats(farmIdBigInt),
      this.getFinancialStats(farmIdBigInt),
      this.getRecentMortality(farmIdBigInt),
      this.getRecentFeedDistributions(farmIdBigInt),
      this.getRecentSales(farmIdBigInt),
      this.getUpcomingVaccinations(farmIdBigInt),
      this.getLowStockItems(farmIdBigInt),
      this.getBatchSummary(farmIdBigInt),
    ]);

    return {
      birds: birdStats,
      feed: feedStats,
      financial: financialStats,
      recentActivity: {
        mortality: recentMortality,
        feedDistributions: recentFeedDistributions,
        sales: recentSales,
      },
      upcomingVaccinations,
      lowStockItems,
      batchSummary,
    };
  }

  /**
   * Get quick stats (lightweight version)
   */
  async getQuickStats(farmId, currentUser) {
    if (currentUser.role !== 'system_admin') {
      const hasAccess = await userRepository.hasFarmAccess(currentUser.id, farmId);
      if (!hasAccess) {
        throw new ApiError(403, 'You do not have access to this farm');
      }
    }

    const farmIdBigInt = BigInt(farmId);

    const [birdStats, feedStats, financialStats] = await Promise.all([
      this.getBirdStats(farmIdBigInt),
      this.getFeedStats(farmIdBigInt),
      this.getFinancialStats(farmIdBigInt),
    ]);

    return {
      birds: birdStats,
      feed: feedStats,
      financial: financialStats,
    };
  }

  // ---------- Private aggregation methods ----------

  async getBirdStats(farmId) {
    // Total birds alive across active batches (or runs)
    const batchStats = await prisma.batch.aggregate({
      where: {
        farmId: farmId,
        status: 'active',
      },
      _sum: {
        quantityAlive: true,
        quantityDead: true,
        quantitySold: true,
      },
      _count: {
        id: true,
      },
    });

    // Recent mortality (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMortality = await prisma.mortalityRecord.aggregate({
      where: {
        farmId: farmId,
        recordedDate: { gte: sevenDaysAgo },
      },
      _sum: {
        quantityDead: true,
      },
    });

    // Recent sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales = await prisma.sale.aggregate({
      where: {
        farmId: farmId,
        productType: 'bird',
        saleDate: { gte: thirtyDaysAgo },
        deletedAt: null,
      },
      _sum: {
        quantitySold: true,
      },
    });

    return {
      totalAlive: batchStats._sum.quantityAlive || 0,
      totalDead: batchStats._sum.quantityDead || 0,
      totalSold: batchStats._sum.quantitySold || 0,
      activeBatches: batchStats._count.id || 0,
      mortalityLast7Days: recentMortality._sum.quantityDead || 0,
      soldLast30Days: recentSales._sum.quantitySold || 0,
    };
  }

  async getFeedStats(farmId) {
    // Total feed stock (bags) across all feed types
    const stock = await prisma.feedStock.aggregate({
      where: {
        farmId: farmId,
      },
      _sum: {
        quantityBags: true,
      },
    });

    // Low stock feed types (quantity <= reorderLevel)
    const lowStockFeed = await prisma.feedStock.findMany({
      where: {
        farmId: farmId,
        quantityBags: {
          lte: prisma.feedStock.fields.reorderLevel,
        },
      },
      include: {
        feedType: true,
      },
      take: 5,
    });

    return {
      totalBags: stock._sum.quantityBags || 0,
      lowStockItems: lowStockFeed.map(item => ({
        feedType: item.feedType.name,
        quantity: item.quantityBags,
        reorderLevel: item.reorderLevel,
      })),
      lowStockCount: lowStockFeed.length,
    };
  }

  async getFinancialStats(farmId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Revenue from sales (last 30 days)
    const revenue = await prisma.sale.aggregate({
      where: {
        farmId: farmId,
        saleDate: { gte: thirtyDaysAgo },
        deletedAt: null,
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Expenses (last 30 days)
    const expenses = await prisma.expense.aggregate({
      where: {
        farmId: farmId,
        expenseDate: { gte: thirtyDaysAgo },
        deletedAt: null,
      },
      _sum: {
        amount: true,
      },
    });

    // This month vs last month comparison (simple)
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);

    const lastMonthEnd = new Date();
    lastMonthEnd.setDate(0);
    lastMonthEnd.setHours(23, 59, 59, 999);

    const [thisMonthRevenue, lastMonthRevenue] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          farmId: farmId,
          saleDate: { gte: thisMonthStart },
          deletedAt: null,
        },
        _sum: { totalAmount: true },
      }),
      prisma.sale.aggregate({
        where: {
          farmId: farmId,
          saleDate: { gte: lastMonthStart, lte: lastMonthEnd },
          deletedAt: null,
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const rev = revenue._sum.totalAmount || 0;
    const exp = expenses._sum.amount || 0;

    return {
      revenueLast30Days: rev,
      expensesLast30Days: exp,
      netProfitLast30Days: rev - exp,
      thisMonthRevenue: thisMonthRevenue._sum.totalAmount || 0,
      lastMonthRevenue: lastMonthRevenue._sum.totalAmount || 0,
      revenueChangePercent: lastMonthRevenue._sum.totalAmount
        ? ((thisMonthRevenue._sum.totalAmount - lastMonthRevenue._sum.totalAmount) / lastMonthRevenue._sum.totalAmount) * 100
        : 0,
    };
  }

  async getRecentMortality(farmId) {
    return prisma.mortalityRecord.findMany({
      where: { farmId: farmId },
      orderBy: { recordedDate: 'desc' },
      take: 5,
      include: {
        batch: { select: { batchCode: true, breed: true } },
        run: { select: { name: true } },
        reasonCode: true,
        recorder: { select: { fullName: true } },
      },
    });
  }

  async getRecentFeedDistributions(farmId) {
    return prisma.feedDistribution.findMany({
      where: { farmId: farmId },
      orderBy: { distributedDate: 'desc' },
      take: 5,
      include: {
        feedType: { select: { name: true } },
        run: { select: { name: true } },
        distributor: { select: { fullName: true } },
      },
    });
  }

  async getRecentSales(farmId) {
    return prisma.sale.findMany({
      where: {
        farmId: farmId,
        deletedAt: null,
      },
      orderBy: { saleDate: 'desc' },
      take: 5,
      include: {
        customer: { select: { name: true } },
        batch: { select: { batchCode: true } },
      },
    });
  }

  async getUpcomingVaccinations(farmId) {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return prisma.vaccinationSchedule.findMany({
      where: {
        farmId: farmId,
        scheduledDate: { gte: today, lte: nextWeek },
        status: 'pending',
      },
      orderBy: { scheduledDate: 'asc' },
      take: 10,
      include: {
        batch: { select: { batchCode: true, breed: true } },
        vaccine: { select: { name: true } },
      },
    });
  }

  async getLowStockItems(farmId) {
    return prisma.inventoryItem.findMany({
      where: {
        farmId: farmId,
        quantity: {
          lte: prisma.inventoryItem.fields.reorderLevel,
        },
      },
      orderBy: { quantity: 'asc' },
      take: 10,
      select: {
        id: true,
        name: true,
        category: true,
        quantity: true,
        reorderLevel: true,
        unit: true,
      },
    });
  }

  async getBatchSummary(farmId) {
    // Group by batch type
    const batchCounts = await prisma.batch.groupBy({
      by: ['batchType', 'status'],
      where: { farmId: farmId },
      _count: { id: true },
      _sum: { quantityAlive: true },
    });

    // Also get total active batches
    const activeBatches = await prisma.batch.count({
      where: {
        farmId: farmId,
        status: 'active',
      },
    });

    // Get total birds by batch type
    const birdsByType = await prisma.batch.groupBy({
      by: ['batchType'],
      where: { farmId: farmId },
      _sum: { quantityAlive: true },
    });

    return {
      activeBatches,
      totalBatches: batchCounts.reduce((sum, b) => sum + b._count.id, 0),
      byType: birdsByType.map(b => ({
        type: b.batchType,
        totalBirds: b._sum.quantityAlive || 0,
      })),
      statusSummary: batchCounts.map(b => ({
        type: b.batchType,
        status: b.status,
        count: b._count.id,
        birds: b._sum.quantityAlive || 0,
      })),
    };
  }
}

module.exports = new DashboardService();