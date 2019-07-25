const User = require('../../models/user');
const jwt = require('./jwt');
const local = require('./local');

module.exports = () => {
  jwt(User); // jwt auth
  local(User); // local auth
};
