const express = require('express');
const passport = require('passport');

const Router = express();

const UserController = require('../repositories/userManagement/index');
const validateSignUp = require('../../middleware/UserManagement/verifySubUserSignUp');
const userManagement = require('../../middleware/UserManagement/userManagementPermission');
const validateIsAdminUser = require('../../middleware/UserManagement/isAdminUser');

Router.post('/register', validateSignUp, UserController.createUser);
Router.put('/actionOnUser/:id/:action', userManagement, UserController.actionOnUser);
Router.get('/getByToken', UserController.userByToken);
Router.get('/getById/:id', UserController.userById);
Router.get('/getAll', UserController.userByAdminId);
Router.get('/merchants', validateIsAdminUser, UserController.allMerchant);

module.exports = Router;
