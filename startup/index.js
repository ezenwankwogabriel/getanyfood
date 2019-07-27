const path = require('path');
const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const morgan = require('morgan');
const passport = require('passport');
const logger = require('./logger');

const swagger = require('./swagger');
const routes = require('./routes');
const error = require('../middleware/error');

function startup(app) {
  if (!process.env.secret) { return process.exit(1); }

  app.set('view_engine', 'ejs');

  swagger(app); // initialize swagger;
  app.use(passport.initialize());
  app.use(helmet());
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }
  app.use(morgan('combined', {
    stream: {
      write: message => logger.info(message),
    },
  }));
  // parse application/x-www-form-urlencoded
  // for easier testing with Postman or plain HTML forms
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true,
  }));
  app.use(fileUpload());
  app.use(express.static(path.join(__dirname, './../upload')));
  app.use(express.static('public'));
  routes(app); // link to routes
  app.use(error); // error handler
}

module.exports = startup;
