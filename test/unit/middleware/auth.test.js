const Joi = require('@hapi/joi');
const validateForgotPassword = require('../../../middleware/Auth/validateForgotPassword');

describe('Authentication Middlewares', function() {
    describe('User Signup Details', () => {
        it.skip('it should veriy user credentials as valid', () => {
            
        })
    })
    describe('Verify a valid password was provied', function() {
        it.skip('should return 403 a valid password was not provided', () => {
            // const req = jest.fn().mockReturnValue({password: 'hello'});
            // const res = jest.fn();
            // const next = jest.fn();
            // Joi.validate(req, schema);
            // validateForgotPassword(req, res, next)
            // expect(validate).toBeFalsy()
            //expect res.badRequest to be called
            //expect next to be called
            //expect error to be ''
        })
    })
})