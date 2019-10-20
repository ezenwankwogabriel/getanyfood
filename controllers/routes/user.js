const express = require('express');

const Router = express();

const UserController = require('../repositories/userManagement/index');
// const validateSignUp = require('../../middleware/UserManagement/verifySubUserSignUp');
const userManagement = require('../../middleware/UserManagement/userManagementPermission');
const validateIsAdminUser = require('../../middleware/UserManagement/isAdminUser');

Router.post('/register', UserController.createUser);
Router.put('/update', UserController.updateProfile);
Router.put('/actionOnUser/:id/:action', userManagement, UserController.actionOnUser);
Router.get('/getByToken', UserController.userByToken);
Router.get('/getById/:id', UserController.userById);
Router.get('/getAll', UserController.userByAdminId);
Router.get('/:type', validateIsAdminUser, UserController.allUsers);

module.exports = Router;
