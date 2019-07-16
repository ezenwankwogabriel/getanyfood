const logger = require('../startup/logger');
const app = require('express')();

module.exports = function (err, req, res, next) {
    const env = app.get('env') === 'development'
    $debug(err);
    logger.log({
        message: err,
        level: 'error'
    })
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: env ? err.errors ? err.errors : err : {}
    });
}