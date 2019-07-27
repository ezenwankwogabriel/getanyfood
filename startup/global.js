function globals(io, config) {
  /* globals */
  global.myIo = io;
  global.$database = config.dbName;
  global.servername = config.host;
}


module.exports = globals;
