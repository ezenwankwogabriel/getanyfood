const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const {
  dbName, port, debug, host,
} = require('./utils');
require('express-async-errors');
require('dotenv').config();

const envName = app.get('env');

if (!process.env.secret) {
  debug('Please use .env_sample to create your .env file containing secret key');
  process.exit(1);
}

require('./startup/db')(); // start db
require('./startup/global')({ host, port, dbName }); // initialize globals
require('./startup/passport')(); // initialize passport
require('./startup/expressInstanceMethods')(app); // express instance methods

exports.socketIo = io; // initialized before the router files are
require('./controllers/repositories/notification');
require('./startup/index')(app); // startup files

const server = http.listen(port, (err) => {
  if (err) {
    debug({ err });
    process.exit(1);
  }
  debug(`Started on -port ${port} -db: ${dbName} -env: ${envName} -url: ${host}`);
});

module.exports = server;
