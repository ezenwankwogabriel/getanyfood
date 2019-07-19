const User = require('../../models/user/index');

module.exports = function () {
  require('./jwt')(User); // jwt auth
  require('./local')(User); // local auth
};
