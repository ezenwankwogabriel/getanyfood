const { ObjectID } = require('mongodb');

module.exports = function (req, res, next) {
  const { id } = req.params;
  if (ObjectID.isValid(id)) { return next(); }
  return res.badRequest('Id must be a valid mongodb id');
};
