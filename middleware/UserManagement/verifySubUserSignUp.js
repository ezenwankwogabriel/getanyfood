const Joi = require('@hapi/joi');

function verifySubUserSignUp(req, res, next) {
  const { body } = req;
  const schema = {
    firstName: Joi.string().min(3).max(40).required(),
    lastName: Joi.string().min(3).max(40).required(),
    emailAddress: Joi.string().email({ minDomainSegments: 2 }).required(),
    phoneNumber: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/),
    permission: Joi.object(),
  };

  const { error } = Joi.validate(body, schema);
  if (error) return res.badRequest(error.details[0].message);
  return next();
}
module.exports = verifySubUserSignUp;
