const debug = require('debug')('debug');
const logger = require('./logger');

function unhandledError() {
  process
    .on('unhandledRejection', (reason) => {
      debug(reason.errors, 'Unhandled Rejection at Promise');
      logger.log({
        level: 'error',
        message: reason,
      });
      process.exit(1);
    })
    .on('uncaughtException', (err) => {
      debug(err, 'Uncaught Exception thrown');
      logger.log({
        level: 'error',
        message: err,
      });
      process.exit(1);
    });
}

module.exports = unhandledError;
