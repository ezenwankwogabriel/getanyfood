const Joi = require('@hapi/joi');

function validateRecommendVendor(req, res, next) {
  const { body } = req;
  const schema = {
    businessName: Joi.string().min(3).max(40).required(),
    businessAddress: Joi.string().min(3).max(40).required(),
    emailAddress: Joi.string().email({ minDomainSegments: 2 }),
    phoneNumber: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/),
    comment: Joi.string(),
  };

  const { error } = Joi.validate(body, schema);
  if (error) return res.badRequest(error.details[0].message);
  return next();
}
module.exports = validateRecommendVendor;
