module.exports = async function (req, res, next) {
  const { user } = req;
  if (user.userType !== 'super_admin' || user.isAdmin) { return next(); }
  if (user.permission && user.permission.contentManagement) { return next(); }
  return res.unAuthorized('You do not have the required Permission');
};
