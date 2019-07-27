const UserModel = require('../../../models/user/index');
const utils = require('../../../utils');

module.exports = class CreateSubUser {
  static async createUser(req, res) {
    const { body, user } = req;
    const userSubType = utils.UserSubType(user.userType) ? utils.UserSubType(user.userType) : false;
    if (!userSubType) { return res.unAuthorized('Invalid user type, contact admin'); }
    if (!user.verifyPassword(body.adminPassword)) { return res.unAuthorized('Admin Password Incorrect'); }
    const newUser = new UserModel({
      fullName: `${body.firstName} ${body.lastName}`,
      emailAddress: body.emailAddress,
      password: utils.EncryptPassword(body.userPassword),
      permission: body.permission, // verify this
      userType: userSubType,
      adminId: user.adminId || user._id,
    });
    await newUser.save();
    return res.success(newUser);
  }

  static async actionOnUser(req, res) {
    const { id, action } = req.params;

    if (action !== 'activate' && action !== 'deactivate') { return res.badRequest('Status not provided or is of invalid valid'); }

    const userObject = await UserModel.findById(id).exec();
    if (!userObject) { return res.badRequest('Invalid id provided'); }
    userObject.status = action == 'activate' ? 1 : 0;
    await userObject.save();
    return res.success('Updated Successfully');
  }

  static async userByToken(req, res) {
    return res.success(req.user);
  }

  static async userById(req, res) {
    const { id } = req.params;

    const user = await UserModel.findOne({ _id: id }, { password: 0 });
    return res.success(user);
  }

  static async userByAdminId(req, res) {
    let { _id, adminId } = req.user;
    adminId = adminId || _id;
    const query = { adminId };
    switch (req.query) {
      case 'firstName': query.firstName = req.query.firstName; break;
      case 'lastName': query.lastName = req.query.lastName; break;
      case 'emailAddress': query.emailAddress = req.query.emailAddress; break;
      default: break;
    }

    const users = await utils.PaginateRequest(req, query, UserModel);
    res.success(users);
  }
};
