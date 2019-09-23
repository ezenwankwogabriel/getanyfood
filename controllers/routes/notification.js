const { Router } = require('express');
const passport = require('passport');
const notification = require('../repositories/notification');

const router = new Router();

router.use(passport.authenticate(['admin', 'merchant'], { session: false }));

router.post('/bulk', notification.bulkEmail);

module.exports = router;
