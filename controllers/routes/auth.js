const express = require('express');
const Router = express();
const createAdmin = require('../repositories/auth');


Router.post('/admin', createAdmin)

module.exports = Router;