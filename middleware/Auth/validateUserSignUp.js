const Joi = require('@hapi/joi');

module.exports = function (req, res, next) {
  const { body } = req;
  const schema = {
    fullName: Joi.string().min(3).max(40).required(),
    businessAddress: Joi.string().min(3).required(),
    businessName: Joi.string().min(3).required(),
    emailAddress: Joi.string().email({ minDomainSegments: 2 }).required(),
    phoneNumber: Joi.string().min(11).max(11).required(),
    // phoneNumber: Joi.string().min(11).max(11).required(),
    password: Joi.string().min(6).required(),
    userType: Joi.string().min(3).required(), // ensure it is on the list of user types
  };

  const {
    error,
  } = Joi.validate(body, schema);
  if (error) return res.badRequest(error.details[0].message);
  next();
};
