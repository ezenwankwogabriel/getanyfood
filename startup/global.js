const debugApp = require('debug')('app:startup');
const debugRepo = require('debug')('app:repository');

module.exports = function (io, config) {
    /* globals */
 global.myIo = io;
 global.$database = config.dbName;
 global.servername = config.host;
 global.$debugApp = debugApp;
 global.$debugRepo = debugRepo;
}