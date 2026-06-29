const express = require('express');
const router = express.Router();

// Import module routes
const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/users.routes');
const farmRoutes = require('../modules/farms/farms.routes');
const houseRoutes = require('../modules/houses/houses.routes');
const runRoutes = require('../modules/runs/runs.routes');

// Register routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/farms', farmRoutes);
router.use('/houses', houseRoutes);
router.use('/runs', runRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;