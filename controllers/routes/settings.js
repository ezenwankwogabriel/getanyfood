const { Router } = require('express');
const passport = require('passport');
const Settings = require('../repositories/settings');

const router = new Router();

router.use(passport.authenticate('admin', { session: false }));

router.use(Settings.scopeRequest);

router.get('/', Settings.show);

router.patch('/', Settings.update);

module.exports = router;
