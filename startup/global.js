const debugApp = require('debug')('app:startup');
// const debugRepo = require('debug')('app:controller');

module.exports = function (io, config) {
    /* globals */
 global.myIo = io;
 global.$database = config.dbName;
 global.servername = config.host;
 global.$debug = debugApp;
//  global.$debugRepo = debugRepo;
}