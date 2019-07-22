const mongoose = require('mongoose');
const config = require('config');
const {debug, dbName} = require('../utils/common');

//  DB Connection =============================================================

module.exports = function () {
  mongoose.connect(`mongodb://localhost/${dbName}`, {
    useNewUrlParser: true,
  }, (err) => {
    if (err) {
      debug('database connection error', err);
    } else {
      debug('database connection successful');
    }
  });
};
