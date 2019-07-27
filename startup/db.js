const mongoose = require('mongoose');
const config = require('config');
const { debug, dbName } = require('../utils');

//  DB Connection =============================================================
function dbConnect() {
  mongoose.connect(`mongodb://localhost/${dbName}`, {
    useNewUrlParser: true,
  }, (err) => {
    if (err) {
      debug('database connection error', err);
    } else {
      debug('database connection successful');
    }
  });
}
module.exports = dbConnect;
