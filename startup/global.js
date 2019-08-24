function globals(config) {
  /* globals */
  global.$database = config.dbName;
  global.servername = config.host;
}


module.exports = globals;
