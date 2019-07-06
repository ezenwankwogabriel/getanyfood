const path = require('path'),
    bodyParser = require('body-parser'),
    express = require('express'),
    helmet = require('helmet'),
    fileUpload = require('express-fileupload'),
    morgan = require('morgan'),
    passport = require('passport'),
    logger = require('./logger');

module.exports = function (app) {
    app.use(passport.initialize());

    app.set('view_engine', 'ejs');

    app.use(helmet());
    if (process.env.NODE_ENV !== 'test') {
        app.use(morgan('dev'));
    }

    // parse application/x-www-form-urlencoded
    // for easier testing with Postman or plain HTML forms
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));


    app.use(fileUpload());
    app.use(express.static(path.join(__dirname, './../upload')));

    //pass output from morgan middleware to winston
    app.use(morgan("combined", {
        "stream": logger.stream
    }));

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function (err, req, res, next) {
            res.status(err.status || 500);
            res.json({
                message: err.message,
                error: err
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: {}
        });
    });

}