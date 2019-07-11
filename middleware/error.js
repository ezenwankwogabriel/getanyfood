module.exports = function (err, req, res, next) {
    $debug(err);
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: app.get('env') === 'development' ? err : {}
    });
}