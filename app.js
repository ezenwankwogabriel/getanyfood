const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const config = require('config');

const port = config.get('port');
const host = config.get('host');
const dbName = config.get('database');
const envName = app.get('env');


require('./startup/global')(io, {host, port, dbName});
require('./startup/index')(app);
require('./startup/passport')();
require('./startup/expressInstanceMethods')(app);

const server = http.listen(config.port, function(err) {
    if(err) {
        console.log({err})
        process.exit(1)
    }
    $debugApp("Started on -port " + port + ' -db: ' + dbName + ' -env: ' + envName + ' -url: ' + host);
});

module.exports = server;