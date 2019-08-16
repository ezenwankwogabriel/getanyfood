const { Router } = require('express');
const passport = require('passport');
const User = require('../repositories/users');
const Order = require('../repositories/orders');
const Ticket = require('../repositories/tickets');

const router = new Router();

router.use(passport.authenticate('customer', { session: false }));

router.use('/:id', User.scopeRequest('customer'));

router.get('/:id', User.showOne);

router.patch('/:id', User.scopeRequest('customer', true), User.update);

router.delete('/:id', User.delete);

router.post('/:id/orders', Order.create);

router.get('/:id/orders', Order.showAllByCustomer);

router.get('/:id/orders/:orderId', Order.scopeRequest, Order.showOne);

router.post(
  '/:id/orders/:orderId/review',
  Order.scopeRequest,
  Order.reviewOrder,
);

router.put(
  '/:id/orders/:orderId/review',
  Order.scopeRequest,
  Order.reviewOrder,
);

router.post('/:id/tickets', Ticket.create);

router.get('/:id/tickets', Ticket.showAllById);

router.use('/:id/tickets/:ticketId', Ticket.scopeRequestByCreator);

router.get('/:id/tickets/:ticketId', Ticket.showOne);

router.get('/:id/tickets/:ticketId/messages', Ticket.showMessages);

router.post('/:id/tickets/:ticketId/messages', Ticket.createMessage);

module.exports = router;
