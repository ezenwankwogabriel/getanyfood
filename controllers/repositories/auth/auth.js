const crypto = require('crypto');
const User = require('../../../models/user/index');
const encryptPassword = require('../../../utils/encryptPassword');
const CreateUser = require('./createUser');
const Email = require('../../../utils/email');
const {supportEmail, webHost} = require('../../../utils/common');

const userActions = {
  signUp: async (req, res) => {
    const { body } = req;
    const admin = await User.findOne({
      userType: 'admin',
    });
    if (!admin && body.userType !== 'admin') return res.unAuthorized('Create an admin account to continue');
    if (admin && body.userType === 'admin') return res.unAuthorized('Admin account already exists');
    const user = await User.findOne({
      emailAddress: body.emailAddress,
    });
    if (user) { return res.unAuthorized('Account with email address exists'); }
    const newUser = await new CreateUser(body).create();
    return res.success(newUser);
  },

  signIn: async (req, res) => {
    if (!req.user) { return res.unAuthenticated('Invalid details provided'); }
    const authenticatedUser = req.user;
    authenticatedUser.updated_time = new Date();
    await authenticatedUser.save();
    const token = await authenticatedUser.encryptPayload();
    return res.success(token);
  },

  forgotPassword: async (req, res) => {
    const buf = crypto.randomBytes(20);
    const { user } = req;
    const path = req.body.path || 'resetPassword';
    user.token = buf.toString('hex');
    await user.save();
    const details = {
      email: user.emailAddress,
      subject: 'Password Reset GetAnyFood',
      content: `Link to reset of GetAnyFood password account \n ${webHost}/${path}/${user.token}`,
      template: 'email',
    };
    new Email(details).send();
    return res.success('Reset Link Sent to Your Email');
  },

  resendPassword: (req, res) => {
    const path = req.body.path || 'resetPassword';
    if(!req.user.token) 
      return res.badRequest('Use the Reset Password route')
    const details = {
      email: req.user.emailAddress,
      subject: 'Password Reset Jaiye',
      contents: `Link to reset of Jaiye password account \n ${webHost}/${path}/${req.user.token}`,
      template: 'email',
    };
    new Email(details).send();
    res.success('Reset Link Sent to Your Email');
  },

  validatePasswordToken: async (req, res) => {
    const user = await User.findOne({
      token: req.params.token,
    });
    if (!user) { return res.badRequest('Password reset token is invalid'); }
    return res.success();
  },


  resetPassword: async (req, res) => { 
    const newPassword = encryptPassword(req.body.password);
    const user = await User.findOneAndUpdate({
      token: req.params.token,
    }, {
      $set: {
        token: '',
        password: newPassword,
      },
    });
    if (!user) 
      return res.badRequest('Invalid token provided'); 

    const details = {
      subject: 'Password reset',
      email: user.emailAddress,
      content: `You are receiving this because you (or someone else) has changed the password for your account on http://${req.headers.host}.\n\n If you did not request this, please reset your password or contact ${supportEmail} for further actions.\n`,
      template: 'email',
    };
    new Email(details).send();
    res.success('Password Reset successful');
  },
};


module.exports = userActions;
