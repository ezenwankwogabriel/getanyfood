const bcrypt = require('bcrypt-nodejs');

function encryptPassword(providedPassword) {
  /**
     * Encrypts a provided password using bcrypt-nodejs;
     * Returns a hash;
     */
  const salt = bcrypt.genSaltSync(10);
  const encrypted = bcrypt.hashSync(providedPassword, salt);
  return encrypted;
}

module.exports = encryptPassword;
