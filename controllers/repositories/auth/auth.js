const User = require('../../../models/user/index');
const encryptPassword = require('../../../utils/encryptPassword');
const crypto = require('crypto');
const CreateUser = require('./createUser');

const userActions = {
    signUp: async (req, res) => {
        const body = req.body;
        const admin = await User.findOne({
            userType: 'admin'
        })
        if (!admin && body.userType !== 'admin') return res.unAuthorized('Create an admin account to continue');
        if (admin && body.userType === 'admin') return res.unAuthorized('Admin account already exists');
        const user = await User.findOne({
            emailAddress: body.emailAddress
        });
        if (user)
            return res.unAuthorized('Account with email address exists')
        const newUser = await new CreateUser(body).create();
        return res.success(newUser)
    },

    signIn: async (req, res) => {
        if (!req.user)
            return res.unAuthenticated('Invalid details provided')
        let authenticatedUser = req.user;
        authenticatedUser.updated_time = new Date();
        await authenticatedUser.save();
        let token = await authenticatedUser.encryptPayload();
        return res.success(token)
    },

    forgotPassword: async (req, res) => {
        const buf = crypto.randomBytes(20);
        let user = req.user;
        user.token = buf.toString('hex');
        await user.save();
        const details = {
            email: user.emailAddress,
            subject: 'Password Reset GetAnyFood',
            content: `Link to reset of GetAnyFood password account \n ${process.env.web_host}/resetPassword/${user.token}`,
            template: 'email'
        };
        // Email(details);
        return res.success('Reset Link Sent to Your Email');
    },

    resendPassword: (req, res) => {
        const details = {
            email: req.user.emailAddress,
            subject: 'Password Reset Jaiye',
            contents: `Link to reset of Jaiye password account \n ${process.env.web_host}/resetPassword/${req.user.token}`,
            template: 'email'
        };
        // Email(details);
        res.success('Reset Link Sent to Your Email');
    },

    validatePasswordToken: async (req, res) => {
        const user = await User.findOne({
            token: req.params.token
        });
        if (!user)
            return res.badRequest('Password reset token is invalid');
        return res.success();
    },


    resetPassword: async (req, res) => {

        const newPassword = encryptPassword(req.body.password);
        let user = await User.findOneAndUpdate({
            token: req.params.token
        }, {
            $set: {
                token: '',
                password: newPassword
            }
        });
        if (!user)
            res.badRequest('Invalid token provided');

        const details = {
            subject: 'Password reset',
            email: user.email,
            content: `You are receiving this because you (or someone else) has changed the password for your account on http://${req.headers.host}.\n\n If you did not request this, please reset your password or contact support@nerlogistics.com for further actions.\n`,
            template: 'email'
        };
        // Email(details);
        res.success('Password Reset successful');
        return;
    },
}



module.exports = userActions