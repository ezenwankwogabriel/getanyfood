const passport = require('passport');
const Auth = require('../controllers/routes/auth');
const User = require('../controllers/routes/user');
const AuditTrail = require('../controllers/routes/auditTrail');
const adminsRoutes = require('../controllers/routes/admin');
const settingsRoutes = require('../controllers/routes/settings');
const ticketsRoutes = require('../controllers/routes/tickets');
const merchantsRoutes = require('../controllers/routes/merchants');
const customersRoutes = require('../controllers/routes/customers');
const emailRoute = require('../controllers/routes/notification');
const Order = require('../controllers/repositories/orders');

function routeApis(app) {
  app.param(
    [
      'id',
      'categoryId',
      'productId',
      'subProductId',
      'orderId',
      'vendorId',
      'promotionId',
      'ticketId',
    ],
    (req, res, next, value) => {
      const hexRegex = /^[\da-e]+$/i;
      if (hexRegex.test(value)) {
        return next();
      }
      return next('route');
    },
  );

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
  app.use('/customers', customersRoutes);
  app.post('/payment-events', Order.handlePaystackEvents);
  app.use('/email', emailRoute);
}

module.exports = routeApis;
