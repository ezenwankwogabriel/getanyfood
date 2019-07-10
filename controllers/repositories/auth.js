const Joi = require('@hapi/joi');
const bcrypt = require('bcrypt-nodejs');
const User = require('../../models/user/index');


const userActions = {
    async signUp(req, res) {
        const body = req.body;
        let error = validateUser(body);
        if (error) return res.badRequest(error)
        try {
            const admin = await User.findOne({
                userType: 'admin'
            })
            if (!admin && body.userType !== 'admin') return res.unAuthorized('Create an admin account to continue');
            if (admin && body.userType === 'admin') return res.unAuthorized('Admin account already exists');
            if (!admin && body.userType === 'admin') {
                let newUser = new User({
                    firstName: body.firstName,
                    businessAddress: body.businessAddress,
                    emailAddress: body.emailAddress,
                    phoneNumber: body.phoneNumber,
                    password: encryptPassword(body.password),
                    userType: body.userType
                })
                await newUser.save();
                return res.success(newUser)
            }
        } catch (e) {
            $debugApp(e)
        }

    },
    async signIn(req, res) {
        try {
            if (!req.user)
                return res.unAuthenticated('Invalid details provided')
            let authenticatedUser = req.user;
            authenticatedUser.updated_time = new Date();
            await authenticatedUser.save();
            let token = await authenticatedUser.encryptPayload();
            console.log('here', token)
            return res.success(token)
        } catch (e) {
            $debugApp(e)
        }
    },
    forgotPassword(req, res) {

    },
    resetPassword(req, res) {

    }
}

const validateUser = (body) => {
    const schema = {
        fullName: Joi.string().min(3).required(),
        businessAddress: Joi.string().min(3).required(),
        businessName: Joi.string().min(3).required(),
        emailAddress: Joi.string().min(3).required(),
        phoneNumber: Joi.string().min(11).max(11).required(),
        password: Joi.string().min(3).required(),
        userType: Joi.string().min(3).required(), //ensure it is on the list of user types
    }

    const {
        error
    } = Joi.validate(body, schema);
    if (error)
        return error.details[0].message;
    return null
}
const verifyPassword = (providedPassword, encryptPassword) => {
    /**
     * Verifys a password provided with the hash of the password
     * stored using bcrypt-nodejs;
     * Returns a `true` or `false`;
     */
    return bcrypt.compareSync(providedPassword, encryptPassword);
};

const encryptPassword = (providedPassword) => {
    /**
     * Encrypts a provided password using bcrypt-nodejs;
     * Returns a hash;
     */
    const salt = bcrypt.genSaltSync(10);
    const encrypted = bcrypt.hashSync(providedPassword, salt);
    return encrypted;
};

module.exports = userActions