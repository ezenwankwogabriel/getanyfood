const User = require('../../models/user');

module.exports = function () {
    require('./jwt')(User);
}