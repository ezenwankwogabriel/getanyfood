const mongoose = require('mongoose');
const debug = require('debug')('app:startup');
const { dbName } = require('../utils');

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
