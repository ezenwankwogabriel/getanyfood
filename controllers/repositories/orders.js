/* eslint-disable no-underscore-dangle */
const crypto = require('crypto');
const paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);
const { groupBy, sortBy } = require('lodash');
const { DateTime } = require('luxon');
const utils = require('../../utils');
const collate = require('../../utils/collate');
const User = require('../../models/user');
const Product = require('../../models/product');
const Order = require('../../models/order');
const Setting = require('../../models/setting');
const WeeklyPlanner = require('../../models/planner');
const PaymentHistory = require('../../models/payment/paymentHistory');
const {
  SendNotification,
} = require('../../controllers/repositories/notification');
const { Email } = require('../../utils');

function search(model, query, options = {}) {
  return new Promise((resolve, reject) => {
    model.textSearch(query, options, (err, { results }) => {
      if (err) return reject(err);
      return resolve(results);
    });
  });
}

function sumTotal(total, order) {
  return total + (order.priceTotal - order.delivery.price);
}

const orderActions = {
  // eslint-disable-next-line consistent-return
  async scopeRequest(req, res, next) {
    try {
      const order = await Order.findOne({
        _id: req.params.orderId,
      })
        .populate({
          path: 'items.product',
          model: Product,
        })
        .populate({
          path: 'customer',
          model: User,
          select: '-password -deleted',
        })
        .populate({
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        });

      if (!order) return res.status(404).send('This order does not exist');

      req.scopedOrder = order;
      return next();
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    const { path } = req.query; // path for request page to view created order;
    try {
      const {
        deliveryTime,
        deliveryDate,
        endDate,
        startDate,
        ...rest
      } = req.body;
      const order = new Order({
        ...rest,
        customer: req.user.id,
      });
      if (endDate && startDate) {
        // save as planner if not exist
        let plannerDoc = await WeeklyPlanner.findOne({
          customer: req.user.id,
          startDate: { $gte: startDate },
          endDate: { $lte: endDate },
        });
        const plannerOrder = {
          deliveryDate,
          orderNumber: order._id,
          deliveryTime,
          merchant: order.merchant,
        };
        if (plannerDoc) {
          plannerDoc.orders.push(plannerOrder);
          plannerDoc.payment.status = 'pending';
        } else {
          plannerDoc = new WeeklyPlanner({
            startDate,
            endDate,
            customer: req.user.id,
            orders: [plannerOrder],
          });
        }
        req.planner = plannerDoc;
        order.planner = {
          id: plannerDoc._id,
          deliveryDate,
          deliveryTime,
        };
      }
      const [
        savedOrder,
        priceTotal,
        merchant,
        customer,
        settings,
      ] = await Promise.all([
        order.save(),
        utils.getPriceTotal(order),
        User.findById(req.body.merchant),
        User.findById(req.user.id),
        Setting.findOne(),
      ]);

      const delivery = {
        ...merchant.delivery,
        ...customer.delivery,
        ...req.body.delivery,
      };

      const sameState = merchant.location.state.toLowerCase()
        === delivery.location.state.toLowerCase();
      const sameCity = merchant.location.city.toLowerCase()
        === delivery.location.city.toLowerCase();
      const locationMatch = sameState && sameCity;

      if (!locationMatch) {
        throw new Error('Location mismatch: this order cannot be delivered.');
      }
      const stateSettings = settings.stateSettings(delivery.location.state);
      const price = merchant.delivery.method === 'self'
        ? merchant.delivery.price
        : stateSettings.deliveryCharge;
      const transaction = await paystack.transaction.initialize({
        reference: req.planner ? req.planner.reference : savedOrder.id,
        amount: req.planner ? req.planner.priceTotal * 100 : priceTotal * 100,
        email: customer.emailAddress,
      });
      if (transaction.status !== true) {
        throw new Error(transaction.message);
      }

      const fullOrder = await Order.findByIdAndUpdate(
        savedOrder.id,
        {
          priceTotal,
          delivery: {
            ...delivery,
            price,
          },
          servicePercentage: stateSettings.servicePercentage,
          payment: {
            accessCode: req.planner ? '' : transaction.data.access_code,
          },
        },
        { new: true },
      )
        .populate({
          path: 'customer',
          model: User,
          select: '-password -selected',
        })
        .populate({
          path: 'merchant',
          model: User,
          select: '-password -selected',
        });
      if (req.planner) {
        req.planner.orders.price = price;
        req.planner.priceTotal += priceTotal;
        req.planner.reference = `000${req.planner._id}${req.planner.orders.length}`;
        req.planner.payment.accessCode = transaction.data.access_code;
        await req.planner.save();
      } // save weekly planner details if exists;
      SendNotification({
        message: `An order has been placed by ${customer.fullName}`,
        orderNumber: fullOrder._id,
        notificationTo: merchant._id,
        notificationFrom: customer._id,
      });
      const details = {
        email: merchant.emailAddress,
        subject: 'New Order',
        content: `An order has with id ${fullOrder._id}, been placed by ${customer.fullName}`,
        template: 'email',
        link: `${path}?customerId=${fullOrder._id}`,
        button: 'View Request',
      };
      Email(details).send();
      return res.success(req.planner ? req.planner : fullOrder);
    } catch (err) {
      return next(err);
    }
  },

  async plannerList(req, res, next) {
    const queryOptions = {
      populate: [
        {
          path: 'customer',
          model: User,
          select: '-password -deleted',
        },
        {
          path: 'orders.orderNumber',
          model: Order,
        },
      ],
    };
    try {
      const plans = await utils.PaginateRequest(
        req,
        queryOptions,
        WeeklyPlanner,
      );
      return res.success(plans);
    } catch (ex) {
      return next(ex);
    }
  },

  async showAllByMerchant(req, res, next) {
    const queryOptions = {
      merchant: req.params.id,
      populate: [
        {
          path: 'customer',
          model: User,
          select: '-password -deleted',
        },
        {
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        },
        {
          path: 'items.product',
          model: Product,
        },
      ],
    };
    try {
      const orders = await utils.PaginateRequest(req, queryOptions, Order);
      res.success(orders);
    } catch (err) {
      next(err);
    }
  },

  async showAllByCustomer(req, res, next) {
    const queryOptions = {
      customer: req.params.id,
      populate: [
        {
          path: 'customer',
          model: User,
          select: '-password -deleted',
        },
        {
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        },
        {
          path: 'items.product',
          model: Product,
        },
      ],
    };

    const { query } = req.query;

    if (query && query.trim()) {
      const [products, merchants] = await Promise.all([
        search(Product, query),
        search(User, query, { filter: { userType: 'merchant' } }),
      ]);

      const getId = ({ _id: id }) => id;

      const productIds = products.map(getId);
      const merchantIds = merchants.map(getId);

      queryOptions.$or = [
        { 'items.product': { $in: productIds } },
        { merchant: { $in: merchantIds } },
      ];
    }

    try {
      const orders = await utils.PaginateRequest(req, queryOptions, Order);
      res.success(orders);
    } catch (err) {
      next(err);
    }
  },

  showOne(req, res) {
    res.success(req.scopedOrder);
  },

  async reviewOrder(req, res, next) {
    const { comment, rating } = req.body;
    if (!rating || !Number(rating)) {
      return res.badRequest('A numeric rating must be provided.');
    }
    if (req.scopedOrder.rating && req.method.toLowerCase() !== 'put') {
      return res.badRequest('This order has been reviewed.');
    }
    try {
      const order = await Order.findByIdAndUpdate(
        req.scopedOrder.id,
        { rating, comment },
        { new: true },
      );
      return res.success(order);
    } catch (err) {
      return next(err);
    }
  },

  async showComments(req, res, next) {
    const queryOptions = {
      merchant: req.params.id,
      comment: { $exists: true },
      populate: [
        {
          path: 'customer',
          model: User,
          select: '-password -deleted',
        },
      ],
    };
    try {
      const orders = await utils.PaginateRequest(req, queryOptions, Order);
      const reviews = orders.docs.map(({
        rating, comment, customer, _id,
      }) => ({
        _id,
        rating,
        comment,
        customer,
      }));
      orders.docs = reviews;

      res.success(orders);
    } catch (err) {
      next(err);
    }
  },

  async showCustomerRanking(req, res, next) {
    try {
      const orders = await Order.find({
        merchant: req.params.id,
        'payment.status': 'success',
      });

      const groupedOrders = groupBy(orders, 'customer');

      const result = await Promise.all(
        Object.keys(groupedOrders).map(async (customerId) => {
          const customer = await User.findById(
            customerId,
            '-password -deleted',
          );
          return {
            customer,
            orderCount: groupedOrders[customerId].length,
          };
        }),
      );

      const stats = sortBy(result, 'orderCount').reverse();

      res.success(stats);
    } catch (err) {
      next(err);
    }
  },

  async showPaymentStats(req, res, next) {
    try {
      const orders = await Order.find({
        'payment.status': 'success',
      });

      const ordersByMerchant = groupBy(orders, 'merchant');

      let stats = [];
      await Promise.all(
        Object.keys(ordersByMerchant).map(async (merchant) => {
          const merchantDoc = await User.findById(
            merchant,
            'businessName emailAddress phoneNumber',
          );
          const orderCount = ordersByMerchant[merchant].length;
          const deliveryCount = ordersByMerchant[merchant].filter(
            ({ delivery }) => delivery.method !== 'self',
          ).length;
          const merchantOrders = ordersByMerchant[merchant].map((order) => {
            const deliveryCharge = order.delivery.method === 'self' ? 0 : order.delivery.price;
            const itemValue = order.priceTotal - deliveryCharge;
            const serviceCharge = (itemValue * order.servicePercentage) / 100;
            const { month, year } = DateTime.fromJSDate(order.createdAt);

            return {
              deliveryCharge,
              serviceCharge,
              month,
              year,
              period: `${year}${month}`,
            };
          });

          const merchantOrdersByPeriod = groupBy(merchantOrders, 'period');

          // eslint-disable-next-line max-len
          const results = Object.keys(merchantOrdersByPeriod).map(period => merchantOrdersByPeriod[period].reduce(
            (
              {
                deliveryCharge: totalDeliveryCharge,
                serviceCharge: totalServiceCharge,
              },
              {
                deliveryCharge, serviceCharge, month, year,
              },
            ) => ({
              merchant: merchantDoc,
              month,
              year,
              deliveryCount,
              orderCount,
              deliveryCharge: totalDeliveryCharge + deliveryCharge,
              serviceCharge: totalServiceCharge + serviceCharge,
            }),
            {
              deliveryCharge: 0,
              serviceCharge: 0,
            },
          ));
          stats = stats.concat(results);
          return true;
        }),
      );

      res.success(stats);
    } catch (err) {
      next(err);
    }
  },

  async showDeliveryRequests(req, res, next) {
    const queryOptions = {
      status: { $ne: 'rejected' },
      'delivery.method': { $ne: 'self' },
      populate: [
        {
          path: 'customer',
          model: User,
          select: '-password -deleted',
        },
        {
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        },
      ],
    };
    try {
      const orders = await utils.PaginateRequest(req, queryOptions, Order);

      res.success(orders);
    } catch (err) {
      next(err);
    }
  },

  async exportDeliveryRequests(req, res, next) {
    try {
      const orders = await Order.find({
        status: { $ne: 'rejected' },
        'delivery.method': { $ne: 'self' },
      })
        .populate({
          path: 'customer',
          model: User,
          select: '-password -deleted',
        })
        .populate({
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        });

      const data = orders.map(order => ({
        merchant: order.merchant.businessName,
        customer: order.customer.fullName,
        orderNumber: order.id,
        origin: order.merchant.businessAddress,
        destination: order.delivery.location.address,
        paymentStatus: order.payment.status,
        deliveryStatus: order.status === 'completed' ? 'delivered' : 'pending',
        createdAt: order.createdAt,
      }));

      const fields = [
        'orderNumber',
        'merchant',
        'customer',
        'origin',
        'destination',
        'paymentStatus',
        'deliveryStatus',
        'createdAt',
      ];
      const fieldNames = [
        'Order Number',
        'Merchant',
        'Customer',
        'Origin',
        'Destination',
        'Payment Status',
        'Delivery Status',
        'Date Created',
      ];
      const csv = await utils.ExportCsv(fields, fieldNames, data);
      res.attachment('Delivery Requests.csv');
      res.end(csv);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    if (['rejected', 'failed', 'completed'].includes(req.scopedOrder.status)) {
      return res.badRequest('This order cannot be modified.');
    }
    const { status, pickupTime } = req.body;
    const orderUpdate = {
      status,
    };
    if (status === 'accepted') {
      orderUpdate.pickupTime = pickupTime;
    }
    if (status === 'completed') {
      orderUpdate.completedAt = new Date();
    }
    try {
      if (['rejected', 'failed'].includes(status)) {
        const refund = await paystack.refund
          .create({
            transaction: req.scopedOrder.id,
            amount: req.scopedOrder.priceTotal * 100,
            currency: 'NGN',
          })
          .then(({ data }) => data);
        orderUpdate['payment.refund'] = true;
        orderUpdate['payment.status'] = refund.status;
      }
      await req.scopedOrder.update(orderUpdate);
      const merchant = await User.findById(req.params.id);

      const updatedOrder = await Order.findOne({
        _id: req.params.orderId,
        merchant: req.params.id,
      })
        .populate({
          path: 'customer',
          model: User,
          select: '-password -deleted',
        })
        .populate({
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        });

      SendNotification({
        message: `Request with id by ${updatedOrder._id} has been updated to ${status}`,
        orderNumber: updatedOrder._id,
        notificationTo: updatedOrder._id,
        notificationFrom: req.user._id,
      });
      const details = {
        email: merchant.emailAddress,
        subject: 'Request Status Update',
        content: `Request with id by ${updatedOrder._id} has been updated to ${status}`,
        template: 'email',
        link: `${req.query.path}?id=${updatedOrder._id}`,
        button: 'View Request',
      };
      Email(details).send();

      return res.success(updatedOrder);
    } catch (err) {
      return next(err);
    }
  },

  async handlePaystackEvents(req, res, next) {
    try {
      const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');
      if (hash === req.headers['x-paystack-signature']) {
        const { event, data } = req.body;
        if (event === 'charge.success') {
          const { reference } = data;
          if (reference.indexOf('000') > -1) {
            // weekly planner payment
            const planner = await WeeklyPlanner.findOne({
              reference: data.reference,
            });
            const orderNumbers = planner.orders.map(order => order.orderNumber);
            planner.priceTotal = 0;
            planner.payment.status = data.status;
            const userQuery = planner.orders.map(order => ({
              updateOne: {
                filter: { _id: order.merchant },
                update: { $inc: { walletAmount: order.price, orderCount: 1 } },
              },
            }));
            const paymentQuery = planner.orders.map(order => ({
              insertOne: {
                customer: planner.customer,
                merchant: order.merchant,
                amount: order.price,
              },
            }));

            await Promise.all([
              User.bulkWrite(userQuery), // update walletAmount for merchants
              PaymentHistory.bulkWrite(paymentQuery), // create payment record for individual orders
              Order.update(
                // update individual order payment status
                { _id: { $in: orderNumbers } },
                { payment: { status: data.status } },
              ),
              planner.save(), // save updated planner record
            ]);
          } else {
            const order = await Order.findById(data.reference);
            order.payment.status = data.status;
            const { merchant, customer, priceTotal } = order;
            const payment = new PaymentHistory({
              merchant,
              customer,
              amount: priceTotal,
            });
            await Promise.all([
              order.save(), // update order payment status
              payment.save(), // create payment record for this order
              User.findByIdAndUpdate(merchant, {
                $inc: { walletAmount: priceTotal },
              }), // update user walletAmount for this merchant
            ]);
          }
        }
      }
      res.success();
    } catch (err) {
      next(err);
    }
  },

  async merchantOrderStats(req, res, next) {
    const { id } = req.params;
    const date = new DateTime('now');
    const dayStart = date.startOf('day');
    const dayEnd = date.endOf('day');
    const monthStart = date.startOf('month');
    const monthEnd = date.endOf('month');
    const yearStart = date.startOf('year');
    const yearEnd = date.endOf('year');

    try {
      const [
        pending,
        ongoing,
        completed,
        dayOrders,
        monthOrders,
        yearOrders,
      ] = await Promise.all([
        Order.countDocuments({
          merchant: id,
          'payment.status': 'success',
          status: 'pending',
        }),
        Order.countDocuments({
          merchant: id,
          'payment.status': 'success',
          status: 'accepted',
        }),
        Order.countDocuments({
          merchant: id,
          'payment.status': 'success',
          status: 'completed',
        }),
        Order.find({
          merchant: id,
          'payment.status': 'success',
          createdAt: { $gte: dayStart, $lte: dayEnd },
        }),
        Order.find({
          merchant: id,
          'payment.status': 'success',
          createdAt: { $gte: monthStart, $lte: monthEnd },
        }),
        Order.find({
          merchant: id,
          'payment.status': 'success',
          createdAt: { $gte: yearStart, $lte: yearEnd },
        }),
      ]);

      const daySales = dayOrders.reduce(sumTotal, 0);

      const monthSales = monthOrders.reduce(sumTotal, 0);

      const yearSales = yearOrders.reduce(sumTotal, 0);

      res.success({
        orders: {
          new: pending,
          ongoing,
          completed,
          day: dayOrders.length,
          month: monthOrders.length,
          year: yearOrders.length,
        },
        sales: {
          day: daySales,
          month: monthSales,
          year: yearSales,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async merchantSalesStats(req, res, next) {
    const { id } = req.params;

    try {
      const orders = await Order.find({
        merchant: id,
        'payment.status': 'success',
      });

      const firstOrder = await Order.findOne({
        merchant: id,
        'payment.status': 'success',
      }).sort({ $natural: 1 });

      const startDate = firstOrder
        ? DateTime.fromJSDate(firstOrder.createdAt)
        : new DateTime('now').startOf('year');

      const { month: startMonth, year: startYear } = startDate;

      const { month: currentMonth, year: currentYear } = new DateTime('now');

      const refinedOrders = orders.map((order) => {
        const { month, year } = DateTime.fromJSDate(order.createdAt);
        return {
          amount: order.priceTotal - order.delivery.price,
          month,
          year,
        };
      });

      for (let year = startYear; year <= currentYear; year += 1) {
        const initMonth = year === startYear ? startMonth : 1;
        const termMonth = year === startYear ? currentMonth : 12;
        for (let month = initMonth; month <= termMonth; month += 1) {
          refinedOrders.push({
            amount: 0,
            month,
            year,
          });
        }
      }

      const stats = collate(refinedOrders);

      res.success(stats);
    } catch (err) {
      next(err);
    }
  },

  async adminOrderStats(req, res, next) {
    try {
      const orders = await Order.find({ 'payment.status': 'success' });

      const orderCount = orders.length;
      const { salesSum: totalSales, revenueSum: totalRevenue } = orders
        .map((order) => {
          const sales = order.priceTotal - order.delivery.price;
          const revenue = (sales * order.servicePercentage) / 100;

          return { sales, revenue };
        })
        .reduce(
          ({ salesSum, revenueSum }, { sales, revenue }) => ({
            salesSum: salesSum + sales,
            revenueSum: revenueSum + revenue,
          }),
          { salesSum: 0, revenueSum: 0 },
        );

      res.success({ orderCount, totalSales, totalRevenue });
    } catch (err) {
      next(err);
    }
  },

  async revenueStats(req, res, next) {
    try {
      const orders = await Order.find({ 'payment.status': 'success' });

      const revenueStats = orders.map((order) => {
        const { month, year } = DateTime.fromJSDate(order.createdAt);

        const orderValue = order.priceTotal - order.delivery.price;
        const serviceCharge = (orderValue * order.servicePercentage) / 100;
        const deliveryCharge = order.delivery.method === 'getanyfood' ? order.delivery.price : 0;

        const revenue = serviceCharge + deliveryCharge;

        return {
          month,
          year,
          period: `${year}${month}`,
          amount: revenue,
        };
      });

      const groupedStats = groupBy(revenueStats, 'period');

      const stats = Object.keys(groupedStats).map(period => groupedStats[period].reduce(
        ({ amount: totalAmount }, { month, year, amount }) => ({
          month,
          year,
          amount: totalAmount + amount,
        }),
        { amount: 0 },
      ));

      res.success(stats);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = orderActions;
