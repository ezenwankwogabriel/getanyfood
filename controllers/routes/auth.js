const express = require('express');
const Router = express();
const Auth = require('../repositories/auth');
const passport = require('passport');

/**
 * @swagger 
 * schema definition info goes here...
 ***
 * @swagger
 * definitions:
 *   CompanyPermission:
 *     properties:
 *       firstName:
 *         type: string
 *       lastName:
 *         type: string
 *       enable:
 *         type: enum {'yes' , 'no'} default 'yes'
 *
 */
/**
 * @swagger
 * /register:
 *   get:
 *     tags:
 *       - Company Users Permission
 *     description: Returns all Company users permissions
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: An array of Company users permissions
 *         schema:
 *           $ref: '#/definitions/CompanyPermission'
 */
Router.post('/register', Auth.signUp);
Router.post('/login', passport.authenticate('local', {session: false}), Auth.signIn);
          


module.exports = Router;