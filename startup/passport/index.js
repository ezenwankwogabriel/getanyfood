const User = require('../../models/user/index');

module.exports = function () {
    require('./jwt')(User);
}