const mongoose = require('mongoose');
const Joi = require('')
const Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');

const _ = require('lodash');
const crypto = require('crypto');

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

userSchema.methods.verifyPassword = function() {
    
}

userSchema.statics.createAdmin = async function(body, schema) {
    const schema = {
        firstName: Joi.string().min(3).required(),
        businessAddress: Joi.string().min(3).required(),
        emailAddress: Joi.string().min(3).required(),
        phoneNumber: Joi.string().min(3).required(),
        password: Joi.string().min(3).required(),
        userType: Joi.string().min(3).required(),
    }

    const { error } = Joi.validate(body, schema);
    if(error) 
        return {result: null, error: error.defaults[0].message}
    console.log('hello')
    const user = this.create({firstName: body.firstName})
    console.log({user});
    return {result: user}
}

userSchema.plugin(mongoosePaginate);


module.exports = mongoose.model('User', userSchema);