const express = require('express');
const Router = express();
const passport = require('passport');

const UserController = require('../repositories/userManagement/index');
const validateSignUp = require('../../middleware/UserManagement/verifySubUserSignUp');

Router.post('/register', validateSignUp, UserController.createUser);

module.exports = Router;