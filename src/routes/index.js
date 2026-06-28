const express = require('express');
const router = express.Router();

// Import module routes
const authRoutes = require('../modules/auth/auth.routes');

// Register routes
router.use('/auth', authRoutes);
// Add other module routes as they are built
// router.use('/users', require('../modules/users/users.routes'));
// router.use('/farms', require('../modules/farms/farms.routes'));

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;