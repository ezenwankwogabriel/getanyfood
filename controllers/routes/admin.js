const { Router } = require('express');
const passport = require('passport');
const User = require('../repositories/users');
const Payment = require('../repositories/payment/adminPayment');
const Order = require('../repositories/orders');
const Vendor = require('../repositories/vendors');

const router = new Router();

router.use(passport.authenticate('admin', { session: false }));

router.post('/vendorTypes', Vendor.vendorTypes);

router.get('/payment-request/:isExports?', Payment.getPaymentRequest);

router.put('/mark-as-paid', Payment.markAsPaid);

router.get('/payment-stats', Order.showPaymentStats);

router.get('/paid-requests', Payment.showPaidRequests);

router.get('/paid-requests.csv', Payment.exportPaidRequests);

router.get('/delivery-requests', Order.showDeliveryRequests);

router.get('/delivery-requests.csv', Order.exportDeliveryRequests);

router.get('/stats/orders', Order.adminOrderStats);

router.get('/stats/revenue', Order.revenueStats);

router.get('/stats/users', User.signupStats);

router.get('/stats/signups', User.signupGrowthStats);

router.get('/:id', User.scopeRequest('super_admin'), User.showOne);

router.patch('/:id', User.scopeRequest('super_admin', true), User.update);

module.exports = router;
