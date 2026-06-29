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

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;