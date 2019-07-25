const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const JWT = require('jsonwebtoken');

const { Schema } = mongoose;
const mongoosePaginate = require('mongoose-paginate');

const userSchema = new Schema({
    firstName: String,
    lastName: String,
  businessName: String,
  emailAddress: {
    type: String,
    lowercase: true,
    trim: true,
  },
  phoneNumber: String,
  businessAddress: String,
  password: String,
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

userSchema.methods.verifyPassword = function(providedPassword) {
    return bcrypt.compareSync(providedPassword, this.password);
};

userSchema.methods.encryptPayload = function() {
    const payload = {
        id: this._id,
        email: this.emailAddress,
        userType: this.userType,
    };
    return JWT.sign(payload, process.env.secret, {expiresIn: '30d'});
};

userSchema.statics.findByEmail = function (emailAddress) {
  return this.findOne({ emailAddress });
};

userSchema.statics.verifyAdminPassword = async function (userId, adminPassword) {
  try {
    const adminUser = await this.findOne({ _id: userId });
    return bcrypt.compareSync(adminPassword, adminUser.password);
  } catch (ex) {
    throw new Error(ex);
  }
};

userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', userSchema);
