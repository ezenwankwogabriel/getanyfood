const { socketIo } = require('../../../app');
const NotificationModel = require('../../../models/notification');
const utils = require('../../../utils');

const { debug } = require('../../../utils');

async function fetchNotification({ limit, page, adminId }) {
  const req = {
    query: {
      limit: 10,
      page: 1,
    },
  };
  const query = {
    populate: { path: 'notificationFrom', select: 'profileThumbnail' },
  };
  if (limit) req.query.limit = limit;
  if (page) req.query.page = page;
  if (!adminId) return false;
  query.adminId = adminId;
  const notifications = await utils.PaginateRequest(req, query, NotificationModel);
  return notifications;
}

function fetchNotificationController(socket, emitType) {
  return async ({
    limit, page, adminId,
  }) => {
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
