const logger = require('../startup/logger');
const { debug } = require('../utils');

module.exports = (err, req, res) => {
  const env = req.app.get('env') === 'development';
  let errObject;
  if (env && env.errors) {
    errObject = err.errors;
  }
  if (env && !env.errors) {
    errObject = err;
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
  res.json({
    message: err.message,
    error: errObject || {},
  });
};
