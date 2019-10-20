/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const bcrypt = require('bcrypt-nodejs');
const JWT = require('jsonwebtoken');
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const mongooseTextSearch = require('mongoose-text-search');
const encryptPassword = require('../../utils/encryptPassword');
const Order = require('../../models/order');

const { Schema } = mongoose;

const userSchema = new Schema({
  firstName: {
    type: String,
    minlength: 3,
    required() {
      return this.userType !== 'super_admin';
    },
  },
  lastName: {
    type: String,
    minlength: 2,
    required() {
      return this.userType !== 'super_admin';
    },
  },
  businessName: {
    type: String,
    minlength: 3,
    required() {
      return this.userType === 'merchant';
    },
  },
  emailAddress: {
    type: String,
    unique: true,
    dropDups: true,
    lowercase: true,
    trim: true,
    required: true,
  },
  phoneNumber: {
    type: String,
    minlength: 11,
    maxlength: 11,
    required() {
      return this.userType !== 'super_admin';
    },
  },
  businessAddress: {
    type: String,
    minlength: 3,
    required() {
      return this.userType === 'merchant';
    },
  },
  businessCategory: {
    type: String,
    required() {
      return this.userType === 'merchant';
    },
  },
  businessType: {
    type: String,
    enum: ['Restaurant', 'Supermarket', 'Mini Mart', 'Frozen Foods', 'Drinks'],
  },
  businessDescription: String,
  businessDays: [
    {
      type: String,
      enum: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      required() {
        return this.userType === 'merchant';
      },
    },
  ],
  workingHours: {
    openTime: { type: String },
    closeTime: { type: String },
  },
  location: {
    state: String,
    city: String,
    address: String,
    lat: Number,
    lng: Number,
  },
  delivery: {
    location: {
      state: String,
      city: String,
      address: String,
      lat: Number,
      lng: Number,
    },
    instructions: String,
    method: {
      type: String,
      lowercase: true,
      enum: ['self', 'getanyfood'],
      default: 'getanyfood',
    },
    price: {
      type: Number,
      required() {
        return this.delivery.method === 'self';
      },
    },
    time: {
      type: Number,
      required() {
        return this.delivery.method === 'self';
      },
    },
  },
  walletAmount: { type: Number, default: 0 },
  orderCount: { type: Number, default: 0 },
  password: { type: String, set: encryptPassword, required: true },
  userType: {
    type: String,
    lowercase: true,
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
  verified: {
    type: Boolean,
    required() {
      return this.userType === 'merchant';
    },
    default() {
      return this.userType === 'super_admin';
    },
  },
  bankDetails: {
    bankName: { type: String, trim: true },
    accountNumber: { type: String, minlength: 10, maxlength: 10 },
  },
});

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});
userSchema.methods.getMerchantRating = async function getMerchantRating() {
  const orders = await Order.find({
    // eslint-disable-next-line no-underscore-dangle
    merchant: this._id,
    status: 'completed',
  });

  if (!orders.length) {
    return 0;
  }

  return (
    orders.reduce((total, order) => total + order.rating, 0) / orders.length
  );
};

userSchema.methods.verifyPassword = function verifyPassword(providedPassword) {
  return bcrypt.compareSync(providedPassword, this.password);
};

userSchema.methods.encryptPayload = function encryptPayload() {
  const payload = {
    // eslint-disable-next-line no-underscore-dangle
    id: this._id,
    email: this.emailAddress,
    userType: this.userType,
  };
  return JWT.sign(payload, process.env.secret, { expiresIn: '30d' });
};

userSchema.statics.findByEmail = function findByEmail(emailAddress) {
  return this.findOne({ emailAddress });
};

userSchema.statics.verifyAdminPassword = async function verifyAdminPassword(
  userId,
  adminPassword,
) {
  try {
    const adminUser = await this.findOne({ _id: userId });
    const user = bcrypt.compareSync(adminPassword, adminUser.password);
    return user;
  } catch (ex) {
    throw new Error(ex);
  }
};

userSchema.index({ businessName: 'text' });

userSchema.plugin(mongoosePaginate);

userSchema.plugin(mongooseTextSearch);

module.exports = mongoose.model('User', userSchema);
