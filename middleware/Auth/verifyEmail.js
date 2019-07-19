const UserModel = require('../../models/user');

module.exports = async function (req, res, next) {
  const { emailAddress } = req.body;
  const user = await UserModel.findByEmail(emailAddress);
  if (!user) { return res.badRequest('Email is invalid'); }
  req.user = user;
  next();
};
