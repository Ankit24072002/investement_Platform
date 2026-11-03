const cron = require('node-cron');
const { processDailyROI } = require('../services/businessLogic');

const startCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const processed = await processDailyROI();
      console.log(`Daily ROI cron executed successfully. Processed ${processed} investments.`);
    } catch (error) {
      console.error('Daily ROI cron failed:', error.message);
    }
  });

  console.log('Daily ROI cron job started.');
};

module.exports = { startCronJobs };
