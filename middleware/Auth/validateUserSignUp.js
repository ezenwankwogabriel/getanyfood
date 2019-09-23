const Joi = require('@hapi/joi');

module.exports = (req, res, next) => {
  const { body } = req;
  const schema = {
    firstName: Joi.string()
      .min(3)
      .max(20),
    lastName: Joi.string()
      .min(2)
      .max(30),
    businessAddress: Joi.string().min(3),
    businessName: Joi.string().min(3),
    businessCategory: Joi.string().min(3),
    emailAddress: Joi.string()
      .email({ minDomainSegments: 2 })
      .required(),
    phoneNumber: Joi.string()
      .min(11)
      .max(11)
      .required(),
    password: Joi.string()
      .regex(/^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]{3,30}$/)
      .required(),
    userType: Joi.string()
      .min(3)
      .required(), // ensure it is on the list of user types
  };

  const { error } = Joi.validate(body, schema);
  if (error) return res.badRequest(error.details[0].message);
  return next();
};
