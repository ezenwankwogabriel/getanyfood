const Joi = require('@hapi/joi');

module.exports = function (req, res, next) {
    const body = req.body;
    const schema = {
        fullName: Joi.string().min(3).required(),
        businessAddress: Joi.string().min(3).required(),
        businessName: Joi.string().min(3).required(),
        emailAddress: Joi.string().min(3).required(),
        phoneNumber: Joi.string().min(11).max(11).required(),
        password: Joi.string().min(3).required(),
        userType: Joi.string().min(3).required(), //ensure it is on the list of user types
    }

    const {
        error
    } = Joi.validate(body, schema);
    if (error) return res.badRequest(error.details[0].message)
    next();
}