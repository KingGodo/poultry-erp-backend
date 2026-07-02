// src/jobs/notificationJobs.js
const cron = require('node-cron');
const notificationService = require('../modules/notifications/notifications.service');

// Run every day at 6:00 AM
cron.schedule('0 6 * * *', async () => {
  console.log('⏰ Running daily notification checks...');
  try {
    await notificationService.generateLowFeedStockNotifications();
    await notificationService.generateLowInventoryNotifications();
    await notificationService.generateUpcomingVaccinationNotifications();
    console.log('✅ Notification checks completed.');
  } catch (error) {
    console.error('❌ Notification job failed:', error);
  }
});

module.exports = cron;