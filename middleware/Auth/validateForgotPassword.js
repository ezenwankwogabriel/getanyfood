const Joi = require('@hapi/joi');

module.exports = function (req, res, next) {
  const schema = {
    password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required(),
  };

  const { 
    error,
  } = Joi.validate(req.body, schema);
  if (error) return res.badRequest(error.details[0].message);
  next();
};
