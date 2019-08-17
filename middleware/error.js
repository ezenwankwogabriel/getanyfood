const debug = require('debug')('app:startup');
const logger = require('../startup/logger');

module.exports = (err, req, res, next) => {
  const env = req.app.get('env') === 'development';
  let errObject;
  if (env && env.errors) {
    errObject = err.errors;
  }
  if (env && !env.errors) {
    errObject = err;
  }
  if (res.headersSent) {
    return next(err);
  }
  debug(err);
  logger.log({
    message: err,
    level: 'error',
  });
  if (err.name === 'ValidationError') {
    res.status(400);
  } else {
    res.status(err.status || 500);
  }
  return res.json({
    message: err.message,
    error: errObject || {},
  });
};
