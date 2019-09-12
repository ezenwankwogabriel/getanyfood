const UserModel = require('../../models/user');

async function verifyEmail(req, res, next) {
  const { emailAddress } = req.body;
  const user = await UserModel.findByEmail(emailAddress);
  if (!user) { return res.badRequest('Email is invalid'); }
  req.user = user;
  return next();
}

module.exports = verifyEmail;
