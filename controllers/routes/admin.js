const { Router } = require('express');
const passport = require('passport');
const User = require('../repositories/users');

const router = new Router();

router.use(passport.authenticate('admin', { session: false }));

router.use('/:id', User.scopeRequest('super_admin'));

router.get('/:id', User.showOne);

router.patch('/:id', User.scopeRequest('super_admin', true), User.update);

module.exports = router;
