const crypto = require('crypto');
const User = require('../../../models/user/index');
const CreateUser = require('./createUser');
const {
  supportEmail, AuditTrail,
} = require('../../../utils');
const Email = require('../../../utils/email');

const userActions = {
  signUp: async (req, res) => {
    const { body } = req;
    const admin = await User.findOne({
      userType: 'super_admin',
    });
    if (!admin && body.userType !== 'super_admin') return res.unAuthorized('Create an admin account to continue');
    if (admin && body.userType === 'super_admin') return res.unAuthorized('Admin account already exists');
    const user = await User.findOne({
      emailAddress: body.emailAddress,
    });
    if (user) return res.unAuthorized('Account with email address exists');
    const newUser = await new CreateUser(body).create();
    newUser.token = await newUser.encryptPayload();
    const details = {
      email: newUser.emailAddress,
      subject: 'Sign Up',
      template: 'signup',
    };
    Email(details).send();
    return res.success(newUser);
  },

  signIn: async (req, res) => {
    if (!req.user.status) {
      return res.unAuthenticated('Account Suspended');
    }
    const authenticatedUser = req.user;
    authenticatedUser.updated_time = new Date();
    await authenticatedUser.save();
    await AuditTrail(req, 'Login');
    const token = await authenticatedUser.encryptPayload();
    return res.success(token);
  },

  forgotPassword: async (req, res) => {
    const buf = crypto.randomBytes(20);
    const { user } = req;
    const path = req.body.path || process.env.FORGOT_PASSWORD_PATH;
    const webUrl = process.env.WEB_URL;
    user.token = buf.toString('hex');
    const url = `${webUrl}/${path}/${user.token}`;
    await user.save();
    const details = {
      email: user.emailAddress,
      subject: 'Password Reset GetAnyFood',
      content: `Link to reset of GetAnyFood password account \n ${url}`,
      link: `${url}`,
      buttonText: 'Reset Password',
      template: 'email',
    };
    Email(details).send();
    return res.success('Reset Link Sent to Your Email');
  },

  resendPassword: (req, res) => {
    const path = req.body.path || process.env.FORGOT_PASSWORD_PATH;
    const webUrl = process.env.WEB_URL;
    if (!req.user.token) {
      return res.badRequest('Use the Reset Password route');
    }
    const url = `${webUrl}/${path}/${req.user.token}`;
    const details = {
      email: req.user.emailAddress,
      subject: 'Password Reset GetAnyFood',
      content: `Link to reset of GetAnyFood password account \n ${url}`,
      template: 'email',
      link: `${url}`,
      buttonText: 'Reset Password',
    };
    Email(details).send();
    return res.success('Reset Link Sent to Your Email');
  },

  validatePasswordToken: async (req, res) => {
    const user = await User.findOne({
      token: req.params.token,
    });
    if (!user) {
      return res.badRequest('Password reset token is invalid');
    }
    return res.success();
  },

  resetPassword: async (req, res) => {
    const newPassword = req.body.password;
    const user = await User.findOneAndUpdate(
      {
        token: req.params.token,
      },
      {
        $set: {
          token: '',
          password: newPassword,
        },
      },
    );
    if (!user) {
      return res.badRequest('Invalid token provided');
    }
    const url = `${process.env.WEB_URL}/login`;
    const details = {
      subject: 'Password reset',
      email: user.emailAddress,
      content: `You are receiving this because you (or someone else) has changed the password for your account on http://${req.headers.host}.\n\n If you did not request this, please reset your password or contact ${supportEmail} for further actions.\n`,
      link: url,
      buttonText: 'Login',
      template: 'email',
    };
    Email(details).send();
    return res.success('Password Reset successful');
  },
};

module.exports = userActions;
