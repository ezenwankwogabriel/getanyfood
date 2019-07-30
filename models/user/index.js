const bcrypt = require('bcrypt-nodejs');
const JWT = require('jsonwebtoken');
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const encryptPassword = require('../../utils/encryptPassword');

const { Schema } = mongoose;

const userSchema = new Schema({
  firstName: {
    type: String,
    minlength: 3,
  },
  lastName: {
    type: String,
    minlength: 2,
  },
  businessName: {
    type: String,
    minlength: 3,
    required: () => this.userType === 'merchant',
  },
  emailAddress: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
  },
  phoneNumber: {
    type: String,
    minlength: 11,
    maxlength: 11,
  },
  businessAddress: {
    type: String,
    minlength: 3,
  },
  businessCategory: String,
  businessDescription: String,
  workingHours: {
    openTime: String,
    closeTime: String,
  },
  location: {
    state: String,
    city: String,
  },
  password: { type: String, set: encryptPassword, required: true },
  userType: {
    type: String,
    enum: ['super_admin', 'merchant', 'customer', 'sub_admin', 'sub_merchant'],
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  permission: {
    type: Object,
    contentManagement: Boolean,
    userManagement: Boolean,
    support: Boolean,
    payment: Boolean,
    report: Boolean,
    profile: Boolean,
    orders: Boolean,
  },
  adminId: { type: Schema.Types.ObjectId, ref: 'User' },
  token: String,
  resetPasswordExpires: String,
  confirmation_token: String,
  tokenExpires: Number,
  profilePhoto: {
    type: String,
  },
  profileThumbnail: String,
  created_time: {
    type: Date,
    default: Date.now,
  },
  updated_time: {
    type: Date,
  },
  /* 1:active, 0: suspended */
  status: {
    type: Number,
    default: 1,
  },
  /* 1: deleted, 0: active */
  deleted: {
    type: Number,
    default: 0,
  },
});

userSchema.virtual('fullName').get(() => `${this.firstName} ${this.lastName}`);

userSchema.methods.verifyPassword = function verifyPassword(providedPassword) {
  return bcrypt.compareSync(providedPassword, this.password);
};

userSchema.methods.encryptPayload = function encryptPayload() {
  const payload = {
    id: this._id,
    email: this.emailAddress,
    userType: this.userType,
  };
  return JWT.sign(payload, process.env.secret, { expiresIn: '30d' });
};

userSchema.statics.findByEmail = (emailAddress) =>
  this.findOne({ emailAddress });

userSchema.statics.verifyAdminPassword = async (userId, adminPassword) => {
  try {
    const adminUser = await this.findOne({ _id: userId });
    return bcrypt.compareSync(adminPassword, adminUser.password);
  } catch (ex) {
    throw new Error(ex);
  }
};

userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', userSchema);
