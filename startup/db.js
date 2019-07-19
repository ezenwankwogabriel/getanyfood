const mongoose = require('mongoose');
const config = require('config');

const db = config.get('database');
//  DB Connection =============================================================

module.exports = function () {
  mongoose.connect(`mongodb://localhost/${db}`, {
    useNewUrlParser: true,
  }, (err) => {
    if (err) {
      $debug('database connection error', err);
    } else {
      $debug('database connection successful');
    }
  });
};
