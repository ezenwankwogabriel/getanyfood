const app = require('express')();
const logger = require('../startup/logger');

module.exports = function (err, req, res, next) {
  const env = app.get('env') === 'development';
  let errObject;
  if(env && env.errors) 
    errObject = err.errors;
  if(env && !env.errors) 
    errObject = err;

  $debug(err);
  logger.log({
    message: err,
    level: 'error',
  });
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: errObject || {}
  });
};