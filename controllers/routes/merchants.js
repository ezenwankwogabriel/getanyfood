const { Router } = require('express');
const passport = require('passport');
const User = require('../repositories/users');
const Order = require('../repositories/orders');
const Product = require('../repositories/products');
const Promotion = require('../repositories/promotions');
const Ticket = require('../repositories/tickets');
const Payment = require('../repositories/payment/merchantPayment');

const router = new Router();

router.post('/jobUpdate/:id', Order.updateFromNester);

router.use(passport.authenticate(['admin', 'merchant'], { session: false }));

router.get('/', User.showAllMerchants);

router.get('/payment-graph', Payment.merchantPaymentsForGraph);

router.get('/payment/:isExports?', Payment.getPayment);

router.post('/request-withdrawal', Payment.requestWithdrawal);

router.use('/:id', User.scopeRequest('merchant'));

router.get('/:id', User.showOne);

router.put('/:id', User.update);

router.get('/:id/stats/orders', Order.merchantOrderStats);

router.get('/:id/stats/sales', Order.merchantSalesStats);

router.get('/:id/orders/comments', Order.showComments);

router.get('/:id/customers/ranking', Order.showCustomerRanking);

router.get('/:id/orders', Order.showAllByMerchant);

router.use('/:id/orders/:orderId', Order.scopeRequest);

router.get('/:id/orders/:orderId', Order.showOne);

router.patch('/:id/orders/:orderId', Order.update);

router.post('/:id/product-categories', Product.Category.create);

router.get('/:id/product-categories', Product.Category.showAll);

router.get('/:id/product-categories/stats', Product.showCategoryStats);

router.get(
  '/:id/product-categories/year-stats',
  Product.showCategoryStatsByYear,
);

router.use(
  '/:id/product-categories/:categoryId',
  Product.Category.scopeRequest,
);

router.get('/:id/product-categories/:categoryId', Product.Category.showOne);

router.put('/:id/product-categories/:categoryId', Product.Category.update);

router.delete('/:id/product-categories/:categoryId', Product.Category.delete);

router.post(
  '/:id/product-categories/:categoryId/products',
  Product.createInCategory,
);

router.get(
  '/:id/product-categories/:categoryId/products',
  Product.showAllInCategory,
);

router.get('/:id/products/stock', Product.showStock);

router.get('/:id/products/stats', Product.showStats);

router.get('/:id/products/year-stats', Product.showProductStatsByYear);

router.get('/:id/products', Product.showAll);

router.get('/:id/products/:productId/stats', Product.showStat);

router.use('/:id/products/:productId', Product.scopeRequest);

router.get('/:id/products/:productId', Product.showOne);

router.put('/:id/products/:productId', Product.update);

router.delete('/:id/products/:productId', Product.delete);

router.post('/:id/products/:productId/sub-products', Product.SubProduct.create);

router.put(
  '/:id/products/:productId/sub-products/:subProductId',
  Product.SubProduct.update,
);

router.delete(
  '/:id/products/:productId/sub-products/:subProductId',
  Product.SubProduct.delete,
);

router.post('/:id/combo-products', Product.ComboProduct.create);

router.get('/:id/combo-products', Product.ComboProduct.showAll);

router.use('/:id/combo-products/:productId', Product.ComboProduct.scopeRequest);

router.get('/:id/combo-products/:productId', Product.showOne);

router.delete('/:id/combo-products/:productId', Product.delete);

router.put('/:id/combo-products/:productId', Product.ComboProduct.update);

router.get('/:id/promotions', Promotion.showAllById);

router.post('/:id/promotions', Promotion.create);

router.use('/:id/promotions/:promotionId', Promotion.scopeRequest);

router.get('/:id/promotions/:promotionId', Promotion.showOne);

router.put('/:id/promotions/:promotionId', Promotion.update);

router.delete('/:id/promotions/:promotionId', Promotion.delete);

router.post('/:id/tickets', Ticket.create);

router.get('/:id/tickets', Ticket.showAllById);

router.use('/:id/tickets/:ticketId', Ticket.scopeRequestByCreator);

router.get('/:id/tickets/:ticketId', Ticket.showOne);

router.get('/:id/tickets/:ticketId/messages', Ticket.showMessages);

router.post('/:id/tickets/:ticketId/messages', Ticket.createMessage);

module.exports = router;
