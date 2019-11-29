/* eslint-disable no-underscore-dangle */
const scheduler = require('node-schedule');
const Order = require('../models/order');
const User = require('../models/user');
const {
  SendNotification,
} = require('../controllers/repositories/notification');
const { Email, charges } = require('../utils');

async function checkHourlyDeliveries() {
  const startTime = new Date(new Date().setHours(0, 0, 0));
  const endTime = new Date(new Date().setMinutes(59, 59, 59));

  const orders = await Order.find({
    'planner.status': 'pending',
    'planner.deliveryDate': { $gte: startTime, $lte: endTime },
  })
    .populate('customer')
    .populate('merchant')
    .exec();

  orders.forEach(async (order) => {
    const {
      customer,
      _id: orderId,
      planner: { merchant },
    } = order;
    const update = {
      'planner.status': 'sent',
      merchant,
    };
    try {
      const { serviceCharge } = charges(order);
      await Order.findByIdAndUpdate(orderId, update);
      await User.findByIdAndUpdate(merchant, {
        $inc: {
          walletAmount: order.priceTotal - serviceCharge,
        },
      });
      SendNotification({
        message: `An order has been placed by ${customer.fullName}`,
        orderNumber: orderId,
        notificationTo: merchant._id,
        notificationFrom: customer._id,
      });
      const details = {
        email: merchant.emailAddress,
        subject: 'New Order',
        content: `An order has with id ${orderId}, been placed by ${customer.fullName}`,
        template: 'email',
        // link: `${path}?customerId=${orderId}`,
        button: 'View Request',
      };
      Email(details).send();
      return null;
    } catch (ex) {
      throw new Error(ex.message);
    }
  });
}

scheduler.scheduleJob('*/2 * * *', checkHourlyDeliveries);
