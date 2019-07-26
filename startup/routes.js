const passport = require('passport');
const Auth = require('../controllers/routes/auth');
const User = require('../controllers/routes/user');
const AuditTrail = require('../controllers/routes/auditTrail');
const adminsRoutes = require('../controllers/routes/admin');
const settingsRoutes = require('../controllers/routes/settings');
const ticketsRoutes = require('../controllers/routes/tickets');
const merchantsRoutes = require('../controllers/routes/merchants');

function routeApis(app) {
  app.use('/', Auth);
  app.use('/user', passport.authenticate('auth', { session: false }), User);
  app.use(
    '/audit',
    passport.authenticate('admin', { session: false }),
    AuditTrail,
  );
  app.use('/admins', adminsRoutes);
  app.use('/settings', settingsRoutes);
  app.use('/tickets', ticketsRoutes);
  app.use('/merchants', merchantsRoutes);
}

module.exports = routeApis;
