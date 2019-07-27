const User = require('../../models/user/index');
const jwt = require('./jwt');
const local = require('./local');

module.exports = function () {
  jwt(User); // jwt auth
  local(User); // local auth
};
