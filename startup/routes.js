const passport = require('passport');
const Auth = require('../controllers/routes/auth');
const User = require('../controllers/routes/user');
const AuditTrail = require('../controllers/routes/auditTrail');

function routeApis(app) {
  app.use('/', Auth);
  app.use('/user', passport.authenticate('auth', { session: false }), User);
  app.use('/audit', passport.authenticate('isAdmin', {session: false}), AuditTrail)
}

module.exports = routeApis;
