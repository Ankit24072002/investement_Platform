const cron = require('node-cron');
const { processDailyROI } = require('../services/businessLogic');

let dailyRoiTask = null;

const startCronJobs = () => {
  if (dailyRoiTask) {
    return dailyRoiTask;
  }

  const timezone = process.env.CRON_TIMEZONE || process.env.TZ || 'UTC';

  dailyRoiTask = cron.schedule(
    '0 0 * * *',
    async () => {
      try {
        const processed = await processDailyROI({ manualRun: false });
        console.log(`Daily ROI cron executed successfully in ${timezone}. Processed ${processed} investments.`);
      } catch (error) {
        console.error('Daily ROI cron failed:', error.message);
      }
    },
    { timezone }
  );

  console.log(`Daily ROI cron job started in timezone ${timezone}.`);
  return dailyRoiTask;
};

module.exports = { startCronJobs };
