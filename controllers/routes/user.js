const express = require('express');

const Router = express();

const UserController = require('../repositories/userManagement/index');
const validateSignUp = require('../../middleware/UserManagement/verifySubUserSignUp');
const userManagement = require('../../middleware/UserManagement/userManagementPermission');

Router.post('/register', validateSignUp, UserController.createUser);
Router.put('/actionOnUser/:id/:action', userManagement, UserController.actionOnUser);
Router.get('/getByToken', UserController.userByToken);
Router.get('/getById/:id', UserController.userById);
Router.get('/getAll', UserController.userByAdminId);

module.exports = Router;
