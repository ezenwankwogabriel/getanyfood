const express = require('express');
const Router = express();
const Auth = require('../repositories/auth');
const passport = require('passport');
const validateSignUp = require('../../middleware/Auth/validateUserSignUp');
const verifyEmail = require('../../middleware/Auth/verifyEmail');
const validateForgotPassword = require('../../middleware/Auth/validateForgotPassword');

Router.post('/register', validateSignUp, Auth.signUp);
Router.post('/login', passport.authenticate('local', {session: false}), Auth.signIn);
Router.post('/forgotPassword', verifyEmail, Auth.forgotPassword)
Router.post('/resendPassword', verifyEmail, Auth.resendPassword)
Router.post('/resetPassword', validateForgotPassword, Auth.resetPassword)
          


module.exports = Router;