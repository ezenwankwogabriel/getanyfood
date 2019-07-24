const Joi = require('@hapi/joi');

module.exports = function (req, res, next) {
  const { body } = req;
  const schema = {
    firstName: Joi.string().min(3).max(40).required(),
    lastname: Joi.string().min(3).max(40).required(),
    emailAddress: Joi.string().email({ minDomainSegments: 2 }).required(),
    password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required(),
  };

  const { error } = Joi.validate(body, schema);
  if (error) return res.badRequest(error.details[0].message);
  next();
};
