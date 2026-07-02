const express = require('express');
const router = express.Router();

// Existing routes
const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/users.routes');
const farmRoutes = require('../modules/farms/farms.routes');
const houseRoutes = require('../modules/houses/houses.routes');
const runRoutes = require('../modules/runs/runs.routes');
const batchRoutes = require('../modules/batches/batches.routes');
const allocationRoutes = require('../modules/batch-allocations/allocations.routes');

// New feed management routes
const feedTypeRoutes = require('../modules/feed-management/feed-types/feed-types.routes');
const feedPurchaseRoutes = require('../modules/feed-management/feed-purchases/feed-purchases.routes');
const feedStockRoutes = require('../modules/feed-management/feed-stock/feed-stock.routes');
const feedDistributionRoutes = require('../modules/feed-management/feed-distributions/feed-distributions.routes');

// Mortality & Vaccination routes
const mortalityReasonRoutes = require('../modules/mortality-vaccination/mortality-reasons/mortality-reasons.routes');
const mortalityRecordRoutes = require('../modules/mortality-vaccination/mortality-records/mortality-records.routes');
const vaccineRoutes = require('../modules/mortality-vaccination/vaccines/vaccines.routes');
const vaccinationScheduleRoutes = require('../modules/mortality-vaccination/vaccination-schedules/vaccination-schedules.routes');
const vaccinationRoutes = require('../modules/mortality-vaccination/vaccinations/vaccinations.routes');

const customerRoutes = require('../modules/customers/customers.routes');
const saleRoutes = require('../modules/sales/sales.routes');
const expenseCategoryRoutes = require('../modules/expense-categories/expense-categories.routes');
const expenseRoutes = require('../modules/expenses/expenses.routes');
const inventoryItemRoutes = require('../modules/inventory-items/inventory-items.routes');
const inventoryTransactionRoutes = require('../modules/inventory-transactions/inventory-transactions.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/farms', farmRoutes);
router.use('/houses', houseRoutes);
router.use('/runs', runRoutes);
router.use('/batches', batchRoutes);
router.use('/batch-allocations', allocationRoutes);

// Feed management routes
router.use('/feed-types', feedTypeRoutes);
router.use('/feed-purchases', feedPurchaseRoutes);
router.use('/feed-stock', feedStockRoutes);
router.use('/feed-distributions', feedDistributionRoutes);

router.use('/mortality-reasons', mortalityReasonRoutes);
router.use('/mortality-records', mortalityRecordRoutes);
router.use('/vaccines', vaccineRoutes);
router.use('/vaccination-schedules', vaccinationScheduleRoutes);
router.use('/vaccinations', vaccinationRoutes);

router.use('/customers', customerRoutes);
router.use('/sales', saleRoutes);
router.use('/expense-categories', expenseCategoryRoutes);
router.use('/expenses', expenseRoutes);
router.use('/inventory-items', inventoryItemRoutes);
router.use('/inventory-transactions', inventoryTransactionRoutes);
router.use('/dashboard', dashboardRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;