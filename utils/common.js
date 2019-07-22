const config = require('config');
const debug = require('debug')('app:startup');


module.exports = {
    port: config.get('port'),
    host: config.get('host'),
    dbName: config.get('database'),
    webHost: config.get('web_host'),
    supportEmail: config.get('support'),
    debug,
}