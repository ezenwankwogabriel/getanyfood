const path = require('path'),
    bodyParser = require('body-parser'),
    express = require('express'),
    helmet = require('helmet'),
    fileUpload = require('express-fileupload'),
    morgan = require('morgan'),
    logger = require('./logger'),
    swaggerJSDoc = require('swagger-jsdoc'),
    swaggerUi = require('swagger-ui-express'),
    passport = require('passport');

module.exports = function (app) {

    if(!process.env.secret) 
        return process.exit(1)
    const options = {
        definition: {
            openapi: '3.0.0', // Specification (optional, defaults to swagger: '2.0')
            info: {
                title: 'Getany Food', // Title (required)
                version: '1.0.0', // Version (required)
            },
            host: 'localhost:3000',
            basePath: '/',
            securityDefinitions: {
                bearerauth: {
                    type: 'apiKey',
                    name: 'Authorization',
                    scheme: 'jwt',
                    in: 'header'
                }
            }
        },
        // Path to the API docs
        apis: ['../controllers/routes/*.js'],
    };
    const swaggerSpec = swaggerJSDoc(options);
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
    app.use(passport.initialize());

    app.set('view_engine', 'ejs');

    app.use(helmet());
    if (process.env.NODE_ENV !== 'test') {
        app.use(morgan('dev'));
    }
    app.use(morgan("combined", {
        stream: {
            write: message => logger.info(message)
        }
    }));

    // parse application/x-www-form-urlencoded
    // for easier testing with Postman or plain HTML forms
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));


    app.use(fileUpload());
    app.use(express.static(path.join(__dirname, './../upload')));
    app.use(express.static('public'))

    //pass output from morgan middleware to winston

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