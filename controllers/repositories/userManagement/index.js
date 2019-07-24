const User = require('../../../models/user/index');
const CreateUser = require('./createUser');
const Email = require('../../../utils/email');
const {supportEmail} = require('../../../utils/common');

module.exports =  class CreateSubUser {
    static async createUser(req, res) {
        //verify auth
        //verify user credentials
        //verify admin password
        //create user setting userType
    }
}