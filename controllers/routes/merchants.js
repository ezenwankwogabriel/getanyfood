const { Router } = require('express');
const passport = require('passport');

const router = new Router();
const User = require('../repositories/users');
const Order = require('../repositories/orders');
const Product = require('../repositories/products');
const Ticket = require('../repositories/tickets');

router.use(passport.authenticate('merchant', { session: false }));

router.use('/:id', User.scopeRequest('merchant'));

router.get('/:id', User.showOne);

router.put('/:id', User.updateMerchant);

router.get('/:id/orders', Order.showAllById);

router.use('/:id/orders/:orderId', Order.scopeRequest);

router.get('/:id/orders/:orderId', Order.showOne);

router.patch('/:id/orders/:orderId', Order.update);

router.post('/:id/product-categories', Product.Category.create);

router.use(
  '/:id/product-categories/:categoryId',
  Product.Category.scopeRequest,
);

router.put('/:id/product-categories/:categoryId', Product.Category.update);

router.post(
  '/:id/product-categories/:categoryId/products',
  Product.createInCategory,
);

router.use(
  '/:id/product-categories/:categoryId/products/:productId',
  Product.scopeRequest,
);

router.get(
  '/:id/product-categories/:categoryId/products/:productId',
  Product.showOne,
);

router.put(
  '/:id/product-categories/:categoryId/products/:productId',
  Product.update,
);

router.post(
  '/:id/product-categories/:categoryId/products/:productId/sub-products',
  Product.SubProduct.create,
);

router.put(
  '/:id/product-categories/:categoryId/products/:productId/sub-products/:subProductId',
  Product.SubProduct.update,
);

router.post('/:id/combo-products', Product.ComboProduct.create);

router.use('/:id/combo-products/:productId', Product.ComboProduct.scopeRequest);

router.get('/:id/combo-products/:productId', Product.showOne);

router.put('/:id/combo-products/:productId', Product.ComboProduct.update);

router.post('/:id/tickets', Ticket.create);

router.get('/:id/tickets', Ticket.showAllById);

router.use('/:id/tickets/:ticketId', Ticket.scopeRequestByCreator);

router.get('/:id/tickets/:ticketId', Ticket.showOne);

router.get('/:id/tickets/:ticketId/messages', Ticket.showMessages);

router.post('/:id/tickets/:ticketId/messages', Ticket.createMessage);

module.exports = router;
