const { Router } = require('express');
const passport = require('passport');
const Settings = require('../repositories/settings');

const router = new Router();

router.use(Settings.scopeRequest);

router.get(
  '/',
  passport.authenticate(['admin', 'merchant'], { session: false }),
  Settings.show,
);

router.patch(
  '/',
  passport.authenticate('admin', { session: false }),
  Settings.update,
);

module.exports = router;
