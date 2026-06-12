// Scheduler job integration
const logger = require('../utils/logger');
const initScheduleCron = require('./scheduleCron');

const initSchedulerJobs = () => {
  logger.info('Scheduler cron system initialized (foundation active).');
  initScheduleCron();
};

module.exports = initSchedulerJobs;
