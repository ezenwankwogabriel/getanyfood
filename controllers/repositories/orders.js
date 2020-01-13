/* eslint-disable no-underscore-dangle */
const crypto = require('crypto');
const uuid = require('uuid/v1');
const paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);
const { groupBy, sortBy } = require('lodash');
const { DateTime } = require('luxon');
const utils = require('../../utils');
const collate = require('../../utils/collate');
const User = require('../../models/user');
const Product = require('../../models/product');
const ProductCategory = require('../../models/product/category');
const Order = require('../../models/order');
const Setting = require('../../models/setting');
const WeeklyPlanner = require('../../models/planner');
const PaymentHistory = require('../../models/payment/paymentHistory');
const {
  SendNotification,
} = require('../../controllers/repositories/notification');
const {
  Email,
  generateOrderId,
  sendToNester,
  charges,
} = require('../../utils');

function search(model, query, options = {}) {
  return new Promise((resolve, reject) => {
    model.textSearch(query, options, (err, { results }) => {
      if (err) return reject(err);
      return resolve(results);
    });
  });
}

function sumTotal(total, { priceTotal }) {
  return total + priceTotal;
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
          path: 'items.product.category',
          model: ProductCategory,
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
        reference: generateOrderId(),
      });
      const merchantId = order.merchant;

      const [priceTotal, merchant, settings] = await Promise.all([
        utils.getPriceTotal(merchantId, order),
        User.findById(merchantId),
        Setting.findOne(),
      ]);

      const stateSettings = settings.stateSettings(merchant.location.state);

      if (endDate && startDate) {
        // save as planner if not exist
        if (startDate > endDate) {
          return res.badRequest('Start Date is greater than End Date range');
        }
        let plannerDoc = await WeeklyPlanner.findOne({
          customer: req.user.id,
          startDate: { $gte: startDate },
          endDate: { $lte: endDate },
        });
        const [hour, min] = deliveryTime.split(':');
        const plannerOrder = {
          deliveryDate: new Date(deliveryDate).setHours(hour || 0, min || 0),
          orderNumber: order._id,
          deliveryTime,
          merchant: order.merchant,
          price: priceTotal,
        };
        if (plannerDoc) {
          plannerDoc.orders.push(plannerOrder);
          plannerDoc.priceTotal += priceTotal;
          plannerDoc.payment.status = 'pending';
        } else {
          plannerDoc = new WeeklyPlanner({
            startDate,
            endDate,
            priceTotal,
            customer: req.user.id,
            orders: [plannerOrder],
          });
        }
        req.planner = plannerDoc;
        req.planner.reference = uuid();
        order.planner = {
          id: plannerDoc._id,
          deliveryDate,
          deliveryTime,
        };
        order.merchant = null; // To be added when delivery date is reached
      }
      const [savedOrder, customer] = await Promise.all([
        order.save(),
        User.findById(req.user.id),
      ]);

      const delivery = {
        ...merchant.delivery,
        ...customer.delivery,
        ...req.body.delivery,
        price: merchant.delivery.price,
      };

      const sameState = merchant.location.state.toLowerCase()
        === delivery.location.state.toLowerCase();
      const sameCity = merchant.location.city.toLowerCase()
        === delivery.location.city.toLowerCase();
      const locationMatch = sameState && sameCity;

      if (!locationMatch) {
        throw new Error('Location mismatch: this order cannot be delivered.');
      }

      delivery.charge = merchant.delivery.method === 'getanyfood'
        ? stateSettings.deliveryCharge
        : 0;
      const transaction = await paystack.transaction.initialize({
        reference: req.planner ? req.planner.reference : savedOrder.id,
        amount: req.planner ? req.planner.priceTotal * 100 : priceTotal * 100,
        email: customer.emailAddress,
      });
      if (transaction.status !== true) {
        throw new Error(transaction.message);
      }

      if (req.planner) {
        req.planner.payment.accessCode = transaction.data.access_code;
        await req.planner.save();
      }

      const fullOrder = await Order.findByIdAndUpdate(
        savedOrder.id,
        {
          priceTotal,
          delivery: {
            ...delivery,
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

      if (!req.planner) {
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
      }
      return res.success(req.planner ? req.planner : fullOrder);
    } catch (err) {
      return next(err);
    }
  },

  async removeOrderFromPlanner(req, res, next) {
    try {
      const { orderId, plannerId } = req.params;
      const { emailAddress } = req.user;
      const planner = await WeeklyPlanner.findById({ _id: plannerId });
      if (!planner) return res.badRequest('Planner not found or invalid id provided');
      const order = planner.orders.find(
        singleOrder => singleOrder._id.toString() === orderId,
      );
      if (order && order.paid) return res.unAuthorized('This order has already been paid for');
      const priceTotal = planner.priceTotal - (order.price || 0);
      const reference = uuid();
      const transaction = await paystack.transaction.initialize({
        reference,
        amount: priceTotal * 100,
        email: emailAddress,
      });
      if (transaction.status !== true) {
        throw new Error(transaction.message);
      }
      const accessCode = transaction.data.access_code;
      await WeeklyPlanner.update(
        { _id: plannerId },
        {
          $pull: { orders: { _id: orderId } },
          $set: { priceTotal, accessCode, reference },
        },
      );

      return res.success('Successful');
    } catch (ex) {
      return next(ex);
    }
  },

  async plannerList(req, res, next) {
    const queryOptions = {
      customer: req.user._id,
      populate: [
        {
          path: 'customer',
          model: User,
          select: '-password -deleted',
        },
        {
          path: 'orders.orderNumber',
          populate: [{ path: 'items.product' }],
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
      'payment.status': 'success',
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
      const ordersWithCategories = await Promise.all(
        orders.docs.map(async (order) => {
          const itemsWithCategories = await Promise.all(
            order.items.map(async (item) => {
              const category = await ProductCategory.findById(
                item.product.category,
                '_id name',
              );

              // eslint-disable-next-line no-param-reassign
              item.product.category = category;

              return item;
            }),
          );

          // eslint-disable-next-line no-param-reassign
          order.items = itemsWithCategories;

          return order;
        }),
      );
      res.success({ ...orders, docs: ordersWithCategories });
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
      const ordersWithCategories = await Promise.all(
        orders.docs.map(async (order) => {
          const itemsWithCategories = await Promise.all(
            order.items.map(async (item) => {
              const category = await ProductCategory.findById(
                item.product.category,
                '_id name',
              );

              // eslint-disable-next-line no-param-reassign
              item.product.category = category;

              return item;
            }),
          );

          // eslint-disable-next-line no-param-reassign
          order.items = itemsWithCategories;

          return order;
        }),
      );
      res.success({ ...orders, docs: ordersWithCategories });
    } catch (err) {
      next(err);
    }
  },

  async showOne(req, res) {
    const order = req.scopedOrder;
    const itemsWithCategories = await Promise.all(
      order.items.map(async (item) => {
        const category = await ProductCategory.findById(
          item.product.category,
          '_id name',
        );

        // eslint-disable-next-line no-param-reassign
        item.product.category = category;

        return item;
      }),
    );

    // eslint-disable-next-line no-param-reassign
    order.items = itemsWithCategories;
    res.success(order);
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
        { rating, comment, ratedAt: new Date() },
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
      const reviews = orders.docs.map(
        ({
          rating, comment, ratedAt, customer, _id,
        }) => ({
          _id,
          rating,
          ratedAt,
          comment,
          customer,
        }),
      );
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
        merchant: { $exists: true, $ne: null },
      });

      const ordersByMerchant = groupBy(orders, 'merchant');

      let stats = [];
      await Promise.all(
        Object.keys(ordersByMerchant).map(async (merchant) => {
          const merchantDoc = await User.findById(
            merchant,
            'businessName emailAddress phoneNumber',
          );
          const merchantOrders = ordersByMerchant[merchant].map((order) => {
            const { revenue, deliveryCharge, serviceCharge } = charges(order);
            const { month, year } = DateTime.fromJSDate(order.createdAt);

            return {
              revenue,
              deliveryMethod: order.delivery.method,
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
                revenue: totalRevenue,
                deliveryCharge: totalDeliveryCharge,
                serviceCharge: totalServiceCharge,
              },
              {
                revenue, deliveryCharge, serviceCharge, month, year,
              },
            ) => ({
              merchant: merchantDoc,
              month,
              year,
              deliveryCount: merchantOrdersByPeriod[period].filter(
                ({ deliveryMethod }) => deliveryMethod === 'getanyfood',
              ).length,
              orderCount: merchantOrdersByPeriod[period].length,
              revenue: totalRevenue + revenue,
              deliveryCharge: totalDeliveryCharge + deliveryCharge,
              serviceCharge: totalServiceCharge + serviceCharge,
            }),
            {
              revenue: 0,
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
      status: { $nin: ['rejected', 'failed'] },
      'delivery.method': 'getanyfood',
      merchant: { $exists: true, $ne: null },
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

  async updateFromNester(req, res, next) {
    try {
      const { id: reference } = req.params;
      const { status } = req.body;
      const order = await Order.findByReference(reference);
      if (!order) return res.badRequest('Request with order number not found');
      if (order.status === 'completed') return res.unAuthorized('Job has already been completed');
      order.status = status;
      if (status === 'completed') {
        order.completedAt = new Date();
      }
      await order.save();
      return res.success('Updated successfully');
    } catch (ex) {
      return next(ex);
    }
  },

  // eslint-disable-next-line consistent-return
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
    const { _id: merchantId } = req.user;
    const {
      _id: orderId,
      merchant: {
        delivery: { method },
      },
      priceTotal,
      customer: {
        _id: customerId,
        emailAddress: customerEmailAddress,
        fullName: customerName,
      },
    } = req.scopedOrder;
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

        const { serviceCharge } = charges(req.scopedOrder);

        await Promise.all([
          req.scopedOrder.update(orderUpdate),
          PaymentHistory.findOneAndRemove({
            merchant: merchantId,
            customer: customerId,
            amount: priceTotal,
          }),
          User.findByIdAndUpdate(merchantId, {
            $inc: {
              walletAmount: -1 * (priceTotal - serviceCharge),
            },
          }),
        ]);
      } else {
        const statePrices = await Setting.findOne();
        const price = statePrices.stateSettings('Lagos');
        if (!price) return res.badRequest('Delivery price not set: Super Admin');
        await Promise.all([
          req.scopedOrder.update(orderUpdate),
          status === 'accepted'
            && method === 'getanyfood'
            && sendToNester(req.scopedOrder, price.deliveryCharge),
        ]);
      }

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
        message: `Request with id by ${orderId} has been updated to ${status}`,
        orderNumber: orderId,
        notificationTo: merchantId,
        notificationFrom: merchantId,
      });
      if (status.includes(['accepted', 'completed'])) {
        let content;
        if (status === 'accepted') content = `Dear ${customerName}, your order has been confirmed, your food item would be delivered as soon as possible`;
        if (status === 'completed') content = `Dear ${customerName}, your order has been completed`;
        const details = {
          email: customerEmailAddress,
          subject: 'Request Status Update',
          content,
          template: 'email',
          link: `${req.query.path}?id=${orderId}`,
          button: 'View Request',
        };
        Email(details).send();
      }

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
          const regexx = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (reference.match(regexx)) {
            // weekly planner payment
            const planner = await WeeklyPlanner.findOne({
              reference: data.reference,
            });
            const orderNumbers = planner.orders.reduce(
              (previousValue, currentValue) => {
                if (!currentValue.paid) {
                  // eslint-disable-next-line no-param-reassign
                  currentValue.paid = true;
                  previousValue.push(currentValue.orderNumber);
                }
                return previousValue;
              },
              [],
            );
            planner.priceTotal = 0;
            planner.payment.status = data.status;
            const userQuery = planner.orders.map(async (order) => {
              const fullOrder = await Order.findById(order.orderNumber);
              const { serviceCharge } = charges(fullOrder);
              return {
                updateOne: {
                  filter: { _id: order.merchant },
                  update: {
                    $inc: {
                      walletAmount: order.price - serviceCharge,
                      orderCount: 1,
                    },
                  },
                },
              };
            });
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
            const { serviceCharge } = charges(order);
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
                $inc: {
                  walletAmount: priceTotal - serviceCharge,
                  orderCount: 1,
                },
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
        const { revenue: amount } = charges(order);
        return {
          amount,
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
          const { revenue: sales, serviceCharge: revenue } = charges(order);

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

        const { serviceCharge: amount } = charges(order);

        return {
          month,
          year,
          period: `${year}${month}`,
          amount,
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
