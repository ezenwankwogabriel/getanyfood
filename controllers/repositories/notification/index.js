const debug = require('debug')('app:startup');
const { socketIo } = require('../../../app');
const NotificationModel = require('../../../models/notification');
const utils = require('../../../utils');

async function bulkEmail(req, res) {
  const {
    to, ...rest
  } = req.body;
  if (to && Array.isArray(to)) {
    for (let i = 0; i < to.length; i += 1) {
      utils.Email({
        email: to[i].email, name: to[i].name, template: 'email', ...rest,
      }).send();
    }
    return res.success();
  }
  return res.badRequest('"to" is not provided or of invalid type');
}
exports.bulkEmail = bulkEmail;

async function fetchNotification({ limit, page, adminId }) {
  try {
    const req = {
      query: {
        limit: 10,
        page: 1,
      },
    };
    const query = {
      populate: { path: 'notificationFrom', select: 'profileThumbnail profilePhoto' },
    };
    if (limit) req.query.limit = limit;
    if (page) req.query.page = page;
    if (!adminId) return false;
    query.notificationTo = adminId;
    const notifications = await utils.PaginateRequest(req, query, NotificationModel);
    return notifications;
  } catch (ex) {
    return debug(ex);
  }
}

function fetchNotificationController(socket, emitType) {
  return async ({ limit, page, adminId }) => {
    try {
      const notifications = await fetchNotification({ limit, page, adminId });
      socket.emit(emitType, notifications);
    } catch (ex) {
      debug(ex);
    }
  };
}

socketIo.on('connection', (socket) => {
  socket.on('initUser', (data) => {
    socket.join(data.userId);
    socket.join(data.adminId);
    socket.emit('JOINED');
  });
  /**
   * @param {Number} limit number of notifications to fetch
   * @param {Number} page page index to start from
   * @param {ObjectId} adminId admin id of user requesting notification
   */
  socket.on('notification', fetchNotificationController(socket, 'notification'));
  socket.on('more', fetchNotificationController(socket, 'more'));

  socket.on('read', async ({ adminId }) => {
    await NotificationModel.update({ notificationTo: adminId }, { $set: { read: true } });
    socket.emit('read');
  });
});

/**
 *
 * @param {String} message notification message
 * @param {ObjectId} notificationTo adminId of receiver
 * @param {ObjectId} notificationFrom adminId of trigger
 */
const Notify = async ({ message, notificationTo, notificationFrom }) => {
  const notification = new NotificationModel({
    notificationTo,
    notificationFrom,
    message,
  });

  await notification.save();
  socketIo.to(notificationTo).emit('newNotification', notification);
};

exports.SendNotification = Notify;
