const ms = require('ms');
const moment = require('moment');
const orderModel = require('../models/order');
const { SendNotification } = require('../controllers/repositories/notification');

async function getRequests(time, status, feedback) {
  const delayNo = status === 'pending' ? 0 : 1;
  const query = {
    delayedOrder: delayNo, status, updatedAt: { $lt: moment().subtract(time, 'minutes') },
  };
  const order = await orderModel.find(query);
  for (let i = 0; i < order.length; i += 1) {
    order[i].delayedOrder += 1; // should always be either 1(accepted) or 2(pending)
    // eslint-disable-next-line no-await-in-loop
    await order[i].save();
    SendNotification({
      // eslint-disable-next-line no-underscore-dangle
      message: `Request with id ${order[i]._id} ${feedback} for over ${time} minutes now`,
      notificationTo: order[i].merchant,
      notificationFrom: order[i].customer,
    });
  }
}

setInterval(() => getRequests(20, 'pending', 'has been pending'), '20mins');
setInterval(() => getRequests(30, 'accepted', 'has not been completed'), ms('30mins'));
