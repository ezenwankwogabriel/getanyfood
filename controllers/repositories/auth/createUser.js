const User = require('../../../models/user/index');

class CreateUser {
  constructor({
    firstName,
    lastName,
    businessAddress,
    businessName,
    businessCategory,
    emailAddress,
    phoneNumber,
    password,
    userType,
  }) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.businessAddress = businessAddress;
    this.businessName = businessName;
    this.businessCategory = businessCategory;
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
    if (userType) {
      return this[userType]();
    }
    throw new Error(
      'Invalid User Type Provided, Allowed userType: [super_admin, merchant, customer]',
    );
  }

  async createMerchant() {
    try {
      const merchant = new User({
        firstName: this.firstName,
        lastName: this.lastName,
        businessAddress: this.businessAddress,
        businessCategory: this.businessCategory,
        businessName: this.businessName,
        emailAddress: this.emailAddress,
        phoneNumber: this.phoneNumber,
        password: this.password,
        userType: this.userType,
        isAdmin: true,
      }, { delivery: 0, password: 0 });
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
        password: this.password,
        userType: this.userType,
        isAdmin: true,
      }, { delivery: 0, password: 0 });
      await admin.save();
      return admin;
    } catch (ex) {
      throw new Error(ex);
    }
  }

  async createCustomer() {
    try {
      const customer = new User({
        firstName: this.firstName,
        lastName: this.lastName,
        emailAddress: this.emailAddress,
        phoneNumber: this.phoneNumber,
        password: this.password,
        userType: this.userType,
        isAdmin: true,
      }, { delivery: 0, password: 0 });
      await customer.save();
      return customer;
    } catch (ex) {
      throw new Error(ex);
    }
  }
}

module.exports = CreateUser;
