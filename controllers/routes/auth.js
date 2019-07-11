const express = require('express');
const Router = express();
const Auth = require('../repositories/auth');
const passport = require('passport');
const validateSignUp = require('../../middleware/Auth/validateUserSignUp')

Router.post('/register', validateSignUp, Auth.signUp);
Router.post('/login', passport.authenticate('local', {session: false}), Auth.signIn);
          


module.exports = Router;