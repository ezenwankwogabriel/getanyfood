const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const JWT = require('jsonwebtoken');
const Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');

const userSchema = new Schema({
    fullName: String,
    businessName: String,
    emailAddress: {
        type: String,
        lowercase: true,
        trim: true
    },
    phoneNumber: String,
    businessAddress: String,
    password: String,
    userType: {
        type: String,
        enum: ['admin', 'merchant', 'customer']
    },
    resetPasswordExpires: String,
    confirmation_token: String,
    tokenExpires: Number,
    profilePhoto: {
        type: String
    },
    profileThumbnail: String,
    created_time: {
        type: Date,
        default: new Date()
    },
    updated_time: {
        type: Date
    },
    /* 1:active, 0: suspended */
    status: {
        type: Number,
        default: 1
    },
    /* 1: deleted, 0: active */
    deleted: {
        type: Number,
        default: 0
    }
});

userSchema.methods.verifyPassword = function(providedPassword) {
    return bcrypt.compareSync(providedPassword, this.password);
}

userSchema.methods.encryptPayload = function() {
    const payload = { id: this._id, email: this.emailAddress, userType: this.userType };
    return JWT.sign(payload, process.env.secret, { expiresIn: '30d' });
}

userSchema.statics.findByEmail = function(emailAddress) {
    return this.findOne({emailAddress});
}

userSchema.plugin(mongoosePaginate);


module.exports = mongoose.model('User', userSchema);