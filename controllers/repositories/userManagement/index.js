/* eslint-disable no-underscore-dangle */
const UserModel = require('../../../models/user/index');
const utils = require('../../../utils');

module.exports = class CreateSubUser {
  static async createUser(req, res) {
    const { body, user } = req;
    const userSubType = utils.UserSubType(user.userType);
    // use adminId(if its a sub user) else use _id(admin user);
    const pass = user.adminId || user._id;
    const emailExists = await UserModel.findByEmail(body.emailAddress);
    if (emailExists) return res.badRequest('Email address exists already');
    const verifiedAdminPass = await UserModel.verifyAdminPassword(
      pass,
      body.adminPassword,
    );
    if (!verifiedAdminPass) return res.unAuthorized('Admin Password Incorrect');
    const newUser = new UserModel({
      firstName: body.firstName,
      lastName: body.lastName,
      emailAddress: body.emailAddress,
      password: utils.EncryptPassword(body.userPassword),
      phoneNumber: body.phoneNumber,
      permission: body.permission, // verify this
      userType: userSubType,
      adminId: user.adminId || user._id,
    });
    const saved = await newUser.save();
    const details = {
      email: user.emailAddress,
      subject: 'Account Registration Details',
      template: 'registration',
    };
    utils.Email(details).send();
    return res.success(saved);
  }

  static async updateProfile(req, res) {
    // accessed by merchant or super admin with priviledge;
    const { adminPassword, newPassword, _id: userId } = req.body;
    const { _id: adminId } = req.user;

    if (!userId) return res.badRequest('User id not provided');

    const adminPassVerified = await UserModel.verifyAdminPassword(
      adminId,
      adminPassword,
    );
    if (!adminPassVerified) return res.badRequest('Admin password incorrect');

    const userUpdate = { ...req.body };
    delete userUpdate.adminPassword;
    delete userUpdate.newPassword;
    if (newPassword) {
      userUpdate.password = utils.EncryptPassword(newPassword);
    }
    await UserModel.findByIdAndUpdate(userId, { $set: { ...userUpdate } });
    return res.success('User profile updated');
  }

  static async actionOnUser(req, res) {
    const { id, action } = req.params;

    if (action !== 'activate' && action !== 'deactivate') {
      return res.badRequest('Status not provided or is of invalid valid');
    }

    const userObject = await UserModel.findById(id).exec();
    if (!userObject) {
      return res.badRequest('Invalid id provided');
    }
    userObject.status = action === 'activate' ? 1 : 0;
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
    const { _id } = req.user;
    let { adminId } = req.user;
    adminId = adminId || _id;
    const query = { adminId };

    if (req.query.name) {
      query.$or = [
        { firstName: new RegExp(req.query.name, 'i') },
        { lastName: new RegExp(req.query.name, 'i') },
      ];
    }
    if (req.query.company) query.businessName = new RegExp(req.query.company, 'i');
    if (req.query.status) query.status = req.query.status === 'active' ? 1 : 0;
    if (req.query.emailAddress) query.emailAddress = new RegExp(req.query.emailAddress, 'i');
    if (req.query.businessName) query.businessName = new RegExp(req.query.businessName, 'i');

    const users = await utils.PaginateRequest(req, query, UserModel);
    res.success(users);
  }

  static async allUsers(req, res) {
    const { type } = req.params;
    if (type !== 'merchant' && type !== 'customer') return res.badRequest('invalid user type');
    const query = { userType: type };
    if (req.query.name) {
      query.$or = [
        { firstName: new RegExp(req.query.name, 'i') },
        { lastName: new RegExp(req.query.name, 'i') },
      ];
    }
    if (req.query.company) query.businessName = new RegExp(req.query.company, 'i');
    if (req.query.status) query.status = req.query.status === 'active' ? 1 : 0;
    if (req.query.emailAddress) query.emailAddress = new RegExp(req.query.emailAddress, 'i');
    if (req.query.businessName) query.businessName = new RegExp(req.query.businessName, 'i');
    if (req.query.adminId) {
      query.adminId = req.query.adminId;
      query.userType = 'sub_merchant';
    }
    if (req.query.endDate && req.query.startDate) {
      query.updated_time = { $gte: req.query.startDate };
      query.updated_time = { $lte: req.query.endDate };
    }

    const users = await utils.PaginateRequest(req, query, UserModel);
    users.docs = await Promise.all(
      users.docs.map(async (user) => {
        const userObject = user.toObject();
        userObject.orderCount = await user.getOrderCount();
        return userObject;
      }),
    );
    return res.success(users);
  }
};
