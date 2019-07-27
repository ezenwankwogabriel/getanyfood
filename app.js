const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const {dbName, port, debug, host} = require('./utils');
require('express-async-errors')
require('dotenv').config()

const envName = app.get('env');
if (!process.env.secret) {
    console.log('Please use .env_sample to create your .env file containing secret key')
    process.exit(1)
}

require('./startup/db')(); //start db
require('./startup/global')(io, {host, port, dbName}); //initialize globals
require('./startup/expressInstanceMethods')(app); //express instance methods
require('./startup/passport')(); //initialize passport
require('./startup/unhandledError')();



require('./startup/index')(app); //startup files

const server = http.listen(port, function(err) {
    if(err) {
        debug({err})
        process.exit(1)
    }
    debug("Started on -port " + port + ' -db: ' + dbName + ' -env: ' + envName + ' -url: ' + host);
});

module.exports = server;