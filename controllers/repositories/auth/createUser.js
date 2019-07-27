const User = require('../../../models/user/index');
const encryptPassword = require('../../../utils/encryptPassword');


class CreateUser {
  constructor({
    fullName, businessAddress, emailAddress, phoneNumber, password, userType,
  }) {
    this.fullName = fullName;
    this.businessAddress = businessAddress;
    this.emailAddress = emailAddress;
    this.phoneNumber = phoneNumber;
    this.password = password;
    this.userType = userType;
    this.types = {
      super_admin: 'createSuperAdmin',
      merchant: 'createMerchant',
      customer: 'createCustomer',
    };
  }

  async create() {
    const userType = this.types[this.userType];
    if (userType) { return this[userType](); }
    throw new Error('Invalid User Type Provided, Allowed userType: [super_admin, merchant, customer]');
  }

  async createMerchant() {
    try {
      const merchant = new User({
        fullName: this.fullName,
        businessAddress: this.businessAddress,
        emailAddress: this.emailAddress,
        phoneNumber: this.phoneNumber,
        password: encryptPassword(this.password),
        userType: this.userType,
        isAdmin: true,
      });
      await merchant.save();
      return merchant;
    } catch (ex) {
      throw new Error(ex);
    }
  }

  async createSuperAdmin() {
    try {
      const admin = new User({
        emailAddress: this.emailAddress,
        password: encryptPassword(this.password),
        userType: this.userType,
        isAdmin: true,
      });
      await admin.save();
      return admin;
    } catch (ex) {
      throw new Error(ex);
    }
  }

  async createCustomer() {
    try {
      const customer = new User({
        fullName: this.fullName,
        emailAddress: this.emailAddress,
        phoneNumber: this.phoneNumber,
        password: encryptPassword(this.password),
        userType: this.userType,
        isAdmin: true,
      });
      await customer.save();
      return customer;
    } catch (ex) {
      throw new Error(ex);
    }
  }
}

module.exports = CreateUser;
